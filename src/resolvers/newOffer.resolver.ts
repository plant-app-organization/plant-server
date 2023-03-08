import { Mutation, Resolver, Args } from '@nestjs/graphql';
import { PrismaService } from '../prisma.service';
import { OfferInput } from './offer.input';
import { User } from '@prisma/client';
import clerk, { sessions } from '@clerk/clerk-sdk-node';

@Resolver()
export class NewOfferResolver {
  constructor(private prisma: PrismaService) {}
  @Mutation(() => String)
  async createNewOffer(
    @Args('newOfferInput') offerInput: OfferInput,
  ): Promise<string> {
    console.log('🔥offerInput dans le resolver newOffer', offerInput);
    // const userList = await clerk.users.getUserList();
    // console.log('userList', userList);
    // const sessionList = await sessions.getSessionList();
    // console.log('sessionList', sessionList);

    // const sessionToken = 'my-session-token';
    // const client = await clerk.clients.verifyClient(sessionToken);
    const result = await this.prisma.offer.create({ data: offerInput });
    console.log('result', result);
    return 'New offer saved in DB';
  }
}
