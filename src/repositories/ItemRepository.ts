import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { endOfMonth, startOfMonth } from "date-fns";
import { Model } from 'mongoose';
import { CreateItemDTO } from "src/dtos/item/CreateItemDTO";
import { getGraphicsByInputAndOutputDTO } from "src/dtos/item/getGraphicsByInputAndOutputDTO";
import { getGraphicsByInputAndOutputRequestDTO } from "src/dtos/item/getGraphicsByInputAndOutputRequestDTO";
import { UpdateItemDTO } from "src/dtos/item/UpdateItemDTO";
import { SearchDataRequestDTO } from "src/dtos/SearchDataRequestDTO";
import { MessageStatusDTO } from "src/dtos/user/MessageStatusDTO";
import { InternalServerErrorException } from "src/exceptions/InternalServerErrorException";
import { NotFoundException } from "src/exceptions/NotFoundException";
import { UnprocessableEntityException } from "src/exceptions/UnprocessableEntityException";
import { ItemInterface } from "src/interfaces/ItemInterface";
import { Item } from "src/schemas/item.schema";

@Injectable()
export class ItemRepository implements ItemInterface{

    constructor(
        @InjectModel(Item.name) private model: Model<Item>
    ){}
    
    async create(data: CreateItemDTO): Promise<MessageStatusDTO> {
        const item = new this.model(data);
        const createdItem = await item.save();
        if(!createdItem){
            throw new InternalServerErrorException("Não foi possivel criar um item");
        }

        return {
            message: 'Item criado',
            status: 201
        };
    }

    async getAll(userId: string,monthActual: string): Promise<Item[]> {
        const month = new Date(`${monthActual} 1, ${new Date().getFullYear()}`).getMonth();
        if (isNaN(month)) {
            throw new Error(`Mês inválido: ${monthActual}`);
        }
    
        const startDate = new Date(Date.UTC(new Date().getFullYear(), month, 1));
        const endDate = new Date(Date.UTC(new Date().getFullYear(), month + 1, 0, 23, 59, 59, 999));
    
        const items = await this.model.find({
            user: userId,
            createdAt: {
                $gte: startDate,
                $lte: endDate,
            },
        });
    
        if (items.length === 0) {
            throw new NotFoundException("Items não encontrados");
        }
        return items;
    }

    async getOne(id: string): Promise<Item> {
        return await this.model.findById(id);
    }

    async update(id: string, data: UpdateItemDTO): Promise<MessageStatusDTO> {
        const updatedItem = await this.model.findByIdAndUpdate(id,data, {new: true});
        if(!updatedItem){
            throw new InternalServerErrorException("Não foi possivel atualizar um item");
        }

        return {
            message: 'Item atualizado',
            status: 200
        };
    }

    async delete(id: string): Promise<MessageStatusDTO> {
        const deletedItem = await this.model.findByIdAndDelete(id);
        if(!deletedItem){
            throw new InternalServerErrorException("Não foi possivel deletar um item");
        }

        return {
            message: 'Item deletado',
            status: 204
        };
    }

    async existsById(id: string): Promise<Boolean> {
        const existsItem = await this.model.findById(id);
        return existsItem ? true : false;
    }

    async getGraphicsByInputAndOutput(userId: string, data: getGraphicsByInputAndOutputRequestDTO): Promise<getGraphicsByInputAndOutputDTO> {
        let totalInputs = 0;
        let totalOutputs = 0;
    
        const hasDateFilter = data?.start_date && data?.end_date;
        let getInputs: any[];
        let getOutputs: any[];
    
        if (hasDateFilter) {
            const { start_date, end_date } = data;
            const [yearStartDate, monthStartDate, dayStartDate] = start_date.toString().split('-').map(Number);
            const [yearEndDate, monthEndDate, dayEndDate] = end_date.toString().split('-').map(Number);
    
            if (
                !yearStartDate || !monthStartDate || !dayStartDate ||
                !yearEndDate || !monthEndDate || !dayEndDate ||
                monthStartDate < 1 || monthStartDate > 12 ||
                monthEndDate < 1 || monthEndDate > 12 ||
                dayStartDate < 1 || dayStartDate > 31 ||
                dayEndDate < 1 || dayEndDate > 31
            ) {
                throw new UnprocessableEntityException('Dados malformados ou incorretos');
            }
    
            const startDateUTC = new Date(Date.UTC(yearStartDate, monthStartDate - 1, dayStartDate));
            const endDateUTC = new Date(Date.UTC(yearEndDate, monthEndDate - 1, dayEndDate));
    
            getInputs = await this.model.find(
                {
                    user: userId,
                    operation: 'entrada',
                    createdAt: {
                        $gte: startDateUTC,
                        $lte: endDateUTC,
                    },
                },
                'price'
            );
    
            getOutputs = await this.model.find(
                {
                    user: userId,
                    operation: 'saida',
                    createdAt: {
                        $gte: startDateUTC,
                        $lte: endDateUTC,
                    },
                },
                'price'
            );
        } else {
            getInputs = await this.model.find(
                { user: userId, operation: 'entrada' },
                'price'
            );
    
            getOutputs = await this.model.find(
                { user: userId, operation: 'saida' },
                'price'
            );
        }
    
        getInputs.forEach((res: { price: number; }) => {
            totalInputs += res.price;
        });
    
        getOutputs.forEach((res: { price: number; }) => {
            totalOutputs += res.price;
        });
    
        return {
            total_inputs: totalInputs,
            total_outputs: totalOutputs,
        };
    }  
    
    async searchData(userId: string, data: SearchDataRequestDTO): Promise<Item[] | MessageStatusDTO> {
        const { startDate, endDate, operation } = data;
    
        const hasDateFilter = startDate && endDate;
    
        let query: any = { user: userId };
    
        if (operation && operation.trim() !== "") {
            query.operation = operation;
        }
    
        if (hasDateFilter) {
            const [yearStartDate, monthStartDate, dayStartDate] = startDate.toString().split('-').map(Number);
            const [yearEndDate, monthEndDate, dayEndDate] = endDate.toString().split('-').map(Number);
    
            if (
                !yearStartDate || !monthStartDate || !dayStartDate ||
                !yearEndDate || !monthEndDate || !dayEndDate ||
                monthStartDate < 1 || monthStartDate > 12 ||
                monthEndDate < 1 || monthEndDate > 12 ||
                dayStartDate < 1 || dayStartDate > 31 ||
                dayEndDate < 1 || dayEndDate > 31
            ) {
                throw new UnprocessableEntityException('Dados malformados ou incorretos');
            }
    
            const startDateUTC = new Date(Date.UTC(yearStartDate, monthStartDate - 1, dayStartDate));
            const endDateUTC = new Date(Date.UTC(yearEndDate, monthEndDate - 1, dayEndDate));
    
            query.createdAt = {
                $gte: startDateUTC,
                $lte: endDateUTC
            };
        }
    
        const items = await this.model.find(query);
    
        if (items.length === 0) {
            throw new NotFoundException("Items não encontrados");
        }
    
        return items;
    }
    
}