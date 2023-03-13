import { Mutation, Resolver, Args, Context } from '@nestjs/graphql'
import { PrismaService } from '../prisma.service'
import { OfferInput } from './offer.input'
import { User } from '@prisma/client'
import clerk, { sessions } from '@clerk/clerk-sdk-node'
//comment
@Resolver()
export class NewOfferResolver {
  constructor(private prisma: PrismaService) {}
  @Mutation(() => String)
  async createNewOffer(
    @Context() context,
    @Args('newOfferInput') offerInput: OfferInput,
  ): Promise<boolean> {
    console.log('🔥offerInput dans le resolver newOffer', offerInput)
    const authorizationHeader = context.req.headers.authorization
    const token = authorizationHeader.split(' ')[1] // extract the token from the header
    console.log('token dans le header', token)

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
      const newOffer = await this.prisma.offer.create({
        data: { ...offerInput, authorId: foundUser.id },
      })
      console.log('newOffer', newOffer)

      const updateUser = await this.prisma.user.update({
        where: {
          clerkId: client.sessions[0].userId,
        },
        data: {
          offerIds: {
            push: newOffer.id,
          },
        },
      })
      console.log('updateUser', updateUser)

      return !!newOffer
    } catch (error) {
      // If an error occurred, return false
      return false
    }
  }
}
