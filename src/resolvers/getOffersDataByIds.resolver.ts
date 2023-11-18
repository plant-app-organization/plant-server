import { Query, Resolver, Args, Context, Int } from '@nestjs/graphql'
import { PrismaService } from '../prisma.service'
import { OfferInput } from './offer.input'
import { User } from '@prisma/client'
import { ObjectId } from 'bson'

import { Offer } from './types/offer.model'
import clerk, { sessions } from '@clerk/clerk-sdk-node'
//comment
//.
@Resolver()
export class GetOffersDataByIdsResolver {
  constructor(private prisma: PrismaService) {}
  @Query((returns) => [Offer], {
    name: 'OffersListByIds',
    description: 'Get List of Offers and data By Ids',
  })
  async getOffersDataByIds(
    @Context() context,
    @Args('offerIds', { type: () => [String] }) offerIds: string[],
  ): Promise<Offer[]> {
    console.log('🔥offerIds dans resolver getOffersDataByIds', offerIds)
    const objectIds = offerIds.map((id) => new ObjectId(id))
    console.log('objectids', objectIds)

    try {
      const foundOffers = await this.prisma.offer.findMany({
        where: {
          id: {
            in: offerIds,
          },
        },
      })
      console.log('foundOffers', foundOffers)

      return foundOffers
    } catch (error) {
      throw new Error('Failed to get offers in GetOffersDataByIds')
    }
  }
}
