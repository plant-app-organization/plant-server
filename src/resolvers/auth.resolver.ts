import { Mutation, Resolver, Args } from '@nestjs/graphql';
import { PrismaService } from '../prisma.service';
import { RegisterInput } from './register.input';
import { User } from '@prisma/client';

@Resolver()
export class AuthResolver {
  constructor(private prisma: PrismaService) {}
  @Mutation(() => String)
  async register(
    @Args('registerInput') registerInput: RegisterInput,
  ): Promise<string> {
    console.log('🔥dans le resolver register');
    const result = await this.prisma.user.create({ data: registerInput });
    console.log('result', result);
    return 'user enregistré';
  }
}
