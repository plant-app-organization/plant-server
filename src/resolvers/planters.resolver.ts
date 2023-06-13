import { Query, Resolver, Args, Context } from '@nestjs/graphql'
import { PrismaService } from '../prisma.service'
// import { RegisterInput } from './register.input'
import { User } from '@prisma/client'

import { Offer } from './types/offer.model'
import { UserModel } from './types/user.model'

import clerk, { sessions } from '@clerk/clerk-sdk-node'
//comment
//.
@Resolver()
export class GetPlantersResolver {
  constructor(private prisma: PrismaService) {}

  @Query((returns) => [UserModel], {
    name: 'UsersList',
    description: 'Get List of Users with the largest amount of active offers',
  })
  async getTopPlanters(
    @Context() context,
    // @Args('searchInput', { type: () => String }) searchInput: string,
  ): Promise<User[]> {
    console.log('🤹GetPlantersResolver')

    try {
      // Step 1: Get all users
      const users = await this.prisma.user.findMany()

      // Step 2: Filter users where offerIds array length is greater than 0
      const usersWithOffers = users.filter((user) => user.offerIds && user.offerIds.length > 0)

      // Step 2: Sort users based on the number of active offers and pick top 12
      const sortedUsers = usersWithOffers
        .sort((a, b) => b.offerIds.length - a.offerIds.length)
        .slice(0, 8)
      // console.log('sortedUsers', sortedUsers)
      return sortedUsers
    } catch (error) {
      // If an error occurred, return false
      throw new Error('Failed to find users in getTopPlanters')
    }
  }
}
