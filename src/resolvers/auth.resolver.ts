import { Mutation, Resolver, Args } from '@nestjs/graphql';
import { PrismaService } from '../prisma.service';
import { RegisterInput } from './register.input';
import { User } from '@prisma/client';
import clerk from '@clerk/clerk-sdk-node';

@Resolver()
export class AuthResolver {
  constructor(private prisma: PrismaService) {}
  @Mutation(() => String)
  async register(
    @Args('registerInput') registerInput: RegisterInput,
  ): Promise<string> {
    console.log('🔥dans le resolver register');
    const userList = await clerk.users.getUserList();
    console.log('userList', userList);
    const result = await this.prisma.user.create({ data: registerInput });
    console.log('result', result);
    return 'user enregistré';
  }
}
