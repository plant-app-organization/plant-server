import { Mutation, Resolver, Args } from '@nestjs/graphql';
import { PrismaService } from '../prisma.service';
import { CompleteProfileInput } from './complete.profile.input';
import { User } from '@prisma/client';
import clerk, { sessions } from '@clerk/clerk-sdk-node';

@Resolver()
export class CompleteProfileResolver {
  constructor(private prisma: PrismaService) {}
  @Mutation(() => String)
  async completeProfile(
    @Args('completeProfileInput') CompleteProfileInput: OfferInput,
  ): Promise<string> {
    // const userList = await clerk.users.getUserList();
    // console.log('userList', userList);
    // const sessionList = await sessions.getSessionList();
    // console.log('sessionList', sessionList);
    const result = await this.prisma.offer.create({
      data: CompleteProfileInput,
    });
    console.log('result', result);
    return 'Profile update in the database';
  }
}
