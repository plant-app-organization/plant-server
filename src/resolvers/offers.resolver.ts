import { Query, Resolver, Args, Context } from '@nestjs/graphql'
import { PrismaService } from '../prisma.service'
import { OfferInput } from './offer.input'
import { User } from '@prisma/client'

import { Offer } from './types/offer.model'
import clerk, { sessions } from '@clerk/clerk-sdk-node'
//comment
//.
@Resolver()
export class GetOffersResolver {
  constructor(private prisma: PrismaService) {}
  @Query((returns) => [Offer], { name: 'OffersList', description: 'Get List of Offers' })
  async getOffers(
    @Context() context,
    // @Args('newOfferInput') offerInput: OfferInput,
  ): Promise<Offer[]> {
    console.log('🔥resolver getOffers')
    const authorizationHeader = context.req.headers.authorization
    const token = authorizationHeader.split(' ')[1] // extract the token from the header
    // console.log('token dans le header', token)

    const client = await clerk.clients.verifyClient(token)
    console.log('client', client)
    console.log('userId', client.sessions[0].userId)
    const user = await clerk.users.getUser(client.sessions[0].userId)
    console.log('🪴user', user)

    const foundUser = await this.prisma.user.findUnique({
      where: {
        clerkId: client.sessions[0].userId,
      },
    })

    console.log('foundUser', foundUser)

    try {
      const foundOffers = await this.prisma.offer.findMany({
        orderBy: [
          {
            updatedAt: 'desc',
          },
        ],
      })
      //   console.log('foundOffers', foundOffers)

      return foundOffers
    } catch (error) {
      // If an error occurred, return false
      throw new Error('Failed to get offers')
    }
  }
}
