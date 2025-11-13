import { InjectModel } from "@nestjs/mongoose";
import { CreateUserDTO } from "src/dtos/user/CreateUserDTO";
import { LoginRequestDTO } from "src/dtos/user/LoginRequestDTO";
import { LoginResponseDTO } from "src/dtos/user/LoginResponseDTO";
import { MessageStatusDTO } from "src/dtos/user/MessageStatusDTO";
import { UpdateUserDTO } from "src/dtos/user/UpdateUserDTO";
import { UserInterface } from "src/interfaces/UserInterface";
import { User } from "src/schemas/user.schema";
import { Model } from 'mongoose';
import { InternalServerErrorException } from "src/exceptions/InternalServerErrorException";
import { BadRequestException, Injectable } from "@nestjs/common";
import * as bycrpt from 'bcryptjs';
import { NotFoundException } from "src/exceptions/NotFoundException";
import { GetIdAndNicknameDTO } from "src/dtos/user/GetIdAndNicknameDTO";

@Injectable()
export class UserRepository implements UserInterface{
    constructor(
        @InjectModel(User.name) private model: Model<User>
    ){}
    async create(data: CreateUserDTO): Promise<MessageStatusDTO> {
        try {
            const user = new this.model(data);
            await user.save();
      
            return {
              message: 'Usuário criado',
              status: 201,
            };
          } catch (error) {
            throw new InternalServerErrorException("Não foi possível salvar o usuário");
          }
    }

    async getAll(): Promise<User[]> {
        return await this.model.find();
    }

    async getOne(id: string): Promise<User> {
        return await this.model.findById(id);
    }

    async update(id: string, data: UpdateUserDTO): Promise<MessageStatusDTO> {
        const updatedUser = await this.model.findByIdAndUpdate(id, data, { new: true});
        if(!updatedUser){
            throw new InternalServerErrorException("Não foi possivel atualizar o usuário");
        }

        return {
            message: 'Usuário atualizado',
            status: 200
        };
    }

    async delete(id: string): Promise<MessageStatusDTO> {
        const deletedUser = this.model.findByIdAndDelete(id);
        if(!deletedUser){
            throw new InternalServerErrorException("Não foi possivel deletar o usuário");
        }

        return {
            message: 'Usuário deletado',
            status: 204
        };
    }

    async login(data: LoginRequestDTO): Promise<boolean> {
        const { email, password } = data;

        const userEmailAndPassword = await this.model
            .findOne()
            .where("email").equals(email)
            .select("email password");

        if (!userEmailAndPassword) {
            throw new NotFoundException('Usuário não encontrado');
        }

        if (password !== userEmailAndPassword.password) {
            throw new BadRequestException('Senhas são diferentes');
        }

        return true;
    }

    async updateTokenByEmailRepository(email: string, token: string){
        return await this.model.findOneAndUpdate(
            { email },
            { $set: { token } },
            { new: true } 
        );
    }

    async existsById(id: string): Promise<Boolean> {
        return await this.model.findById(id) ? true : false;
    }

    async existsByEmail(email: string): Promise<Boolean> {
        return await this.model.findOne({email: email}) ? true : false;
    }

    async getOneByEmail(email: string): Promise<GetIdAndNicknameDTO> {
        return await this.model.findOne(
            {email: email},
            '_id nickname'
        );
    }
}