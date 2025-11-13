import { Injectable } from "@nestjs/common";
import { CreateUserDTO } from "src/dtos/user/CreateUserDTO";
import { GetIdAndNicknameDTO } from "src/dtos/user/GetIdAndNicknameDTO";
import { LoginRequestDTO } from "src/dtos/user/LoginRequestDTO";
import { LoginResponseDTO } from "src/dtos/user/LoginResponseDTO";
import { MessageStatusDTO } from "src/dtos/user/MessageStatusDTO";
import { UpdateUserDTO } from "src/dtos/user/UpdateUserDTO";
import { UserInterface } from "src/interfaces/UserInterface";
import { UserRepository } from "src/repositories/UserRepository";
import { User } from "src/schemas/user.schema";

@Injectable()
export class UserService implements UserInterface{
    constructor(
        private repository: UserRepository
    ){}
    async create(data: CreateUserDTO): Promise<MessageStatusDTO> {
        return await this.repository.create(data);
    }
    
    async getAll(): Promise<User[]> {
        return await this.repository.getAll();
    }
    
    async getOne(id: string): Promise<User> {
        return await this.repository.getOne(id);
    }
    
    async update(id: string, data: UpdateUserDTO): Promise<MessageStatusDTO> {
        return await this.repository.update(id,data);
    }
    
    async delete(id: string): Promise<MessageStatusDTO> {
        return await this.repository.delete(id);
    }
    
    async login(data: LoginRequestDTO): Promise<Boolean> {
        return await this.repository.login(data);
    }
    
    async existsById(id: string): Promise<Boolean> {
        return await this.repository.existsById(id);
    }
    
    async existsByEmail(email: string): Promise<Boolean> {
        return await this.repository.existsByEmail(email);
    }
    
    async getOneByEmail(email: string): Promise<GetIdAndNicknameDTO> {
       return await this.repository.getOneByEmail(email); 
    }

    async updateTokenByEmail(email: string, token: string) {
        return await this.repository.updateTokenByEmailRepository(email, token);
    }

}