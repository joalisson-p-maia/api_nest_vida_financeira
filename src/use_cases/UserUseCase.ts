import { Injectable } from "@nestjs/common";
import { CreateUserDTO } from "src/dtos/user/CreateUserDTO";
import { LoginRequestDTO } from "src/dtos/user/LoginRequestDTO";
import { LoginResponseDTO } from "src/dtos/user/LoginResponseDTO";
import { MessageStatusDTO } from "src/dtos/user/MessageStatusDTO";
import { UpdateUserDTO } from "src/dtos/user/UpdateUserDTO";
import { NotFoundException } from "src/exceptions/NotFoundException";
import { UnprocessableEntityException } from "src/exceptions/UnprocessableEntityException";
import { User } from "src/schemas/user.schema";
import { UserService } from "src/services/User.service";
import * as bcrypt from 'bcryptjs';
import { JwtService } from "@nestjs/jwt";
import { get } from "http";

@Injectable()
export class UserUseCase{
    constructor(
        private readonly service: UserService,
        private readonly jwtService: JwtService
    ){}

    async createUserUseCase(data: CreateUserDTO): Promise<MessageStatusDTO>{
        if(
            data.email === "" || data.email === null ||
            data.nickname === "" || data.nickname === null ||
            data.password === null 
        ){
            throw new UnprocessableEntityException("Campos obrigatórios vazios");
        }

        const { password } = data;
        const salts = 10;

        try{
            const encryptedPassword = await bcrypt.hash(password, salts);

            const newData = new CreateUserDTO(
                data.nickname,data.email,encryptedPassword
            );

            return await this.service.create(newData);
        }catch(error){
            console.log('error: '+error)
        }
    }

    async getAllUsersUseCase(): Promise<User[]>{
        return await this.service.getAll();
    }

    async getOneUserUseCase(id: string): Promise<User>{
        const existsUser = await this.service.existsById(id);
        if(!existsUser){
            throw new NotFoundException("Usuário não encontrado");
        }

        return await this.service.getOne(id);
    }

    async updateUserUseCase(id: string, data: UpdateUserDTO): Promise<MessageStatusDTO>{
        const existsUser = await this.service.existsById(id);
        if(!existsUser){
            throw new NotFoundException("Usuário não encontrado");
        }

        return await this.service.update(id,data);
    }

    async deleteUserUseCase(id: string): Promise<MessageStatusDTO>{
        const existsUser = await this.service.existsById(id);
        if(!existsUser){
            throw new NotFoundException("Usuário não encontrado");
        }

        return await this.service.delete(id);
    }

    async loginUseCase(data: LoginRequestDTO): Promise<LoginResponseDTO | MessageStatusDTO>{
        if(
            data.email === "" || data.email === null ||
            data.password === "" || data.password === null 
        ){
            throw new UnprocessableEntityException("Campos obrigatórios vazios");
        }

        await this.service.login(data);
        const getIdAndNickname = await this.service.getOneByEmail(data.email);
        const payload = {
            sub: getIdAndNickname._id,
            username: getIdAndNickname.nickname
        }

        const token = await this.jwtService.signAsync(payload);

        await this.service.updateTokenByEmail(data.email, token);

        return new LoginResponseDTO(
            "Login realizado com sucesso",
            200,
            token,
            getIdAndNickname._id
        );
    }
}