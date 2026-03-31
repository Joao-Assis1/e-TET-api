import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import {
  Household,
  CreateHouseholdDto,
  UpdateHouseholdDto,
} from './household.entity';

@Injectable()
export class HouseholdsService {
  constructor(
    @InjectRepository(Household)
    private householdRepository: Repository<Household>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    createHouseholdDto: CreateHouseholdDto,
    userId?: number,
  ): Promise<Household> {
    const household = new Household(createHouseholdDto);

    if (userId) {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (user) {
        household.createdBy = user;
        household.cns_profissional = user.cns;
      }
    }

    return this.householdRepository.save(household);
  }

  async findAll(): Promise<Household[]> {
    return this.householdRepository.find();
  }

  async findOne(id: string): Promise<Household> {
    const household = await this.householdRepository.findOne({ where: { id } });
    if (!household) {
      throw new NotFoundException(`Household with ID ${id} not found`);
    }
    return household;
  }

  async update(
    id: string,
    updateHouseholdDto: UpdateHouseholdDto,
  ): Promise<Household> {
    const household = await this.findOne(id);
    Object.assign(household, updateHouseholdDto);
    return this.householdRepository.save(household);
  }

  async remove(id: string): Promise<void> {
    const household = await this.findOne(id);
    await this.householdRepository.softRemove(household);
  }
}
