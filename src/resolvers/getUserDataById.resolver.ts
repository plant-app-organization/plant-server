import { Mutation, Resolver, Args, Context, Query } from '@nestjs/graphql'
import { PrismaService } from '../prisma.service'
import { OfferInput } from './offer.input'
import { UserModel } from './types/user.model'
import { User } from '@prisma/client'
import clerk, { sessions } from '@clerk/clerk-sdk-node'
//comment
@Resolver()
export class GetUserDataByIdResolver {
  constructor(private prisma: PrismaService) {}
  @Query((_returns) => UserModel, { nullable: false, name: 'userDataById' })
  async getUserDataById(@Args('userId') userId: string): Promise<User> {
    const foundUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    })

    console.log('foundUser', foundUser)

    return foundUser
  }
}
