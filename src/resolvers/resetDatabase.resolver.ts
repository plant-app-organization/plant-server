import { Mutation, Resolver } from '@nestjs/graphql'
import { PrismaService } from 'src/prisma.service'
//! ATTENTION CE RESOLVER SUPPRIME TOUTES LES DONNEES EN BDD
@Resolver()
export class ResetResolver {
  constructor(private prisma: PrismaService) {}

  @Mutation(() => Boolean)
  async resetDatabase(): Promise<boolean> {
    // Liste de toutes vos opérations de suppression
    await this.prisma.follow.deleteMany()
    await this.prisma.message.deleteMany()
    await this.prisma.conversation.deleteMany()
    await this.prisma.offer.deleteMany()
    await this.prisma.user.deleteMany()
    await this.prisma.userAddress.deleteMany()
    await this.prisma.plant.deleteMany()
    await this.prisma.review.deleteMany()
    await this.prisma.order.deleteMany()
    await this.prisma.payment.deleteMany()
    return true
  }
}
