import { Query, Resolver, Args, Context } from '@nestjs/graphql'
import { PrismaService } from '../prisma.service'
// import { RegisterInput } from './register.input'
import { Suggestion } from '@prisma/client'

import { SuggestionModel } from './types/suggestion.model'

@Resolver()
export class GetSuggestionsResolver {
  constructor(private prisma: PrismaService) {}

  @Query((returns) => [SuggestionModel], {
    name: 'SuggestionsList',
    description: 'Get List of Suggestions',
  })
  async getSuggestions(
    @Context() context,
    // @Args('searchInput', { type: () => String }) searchInput: string,
  ): Promise<Suggestion[]> {
    console.log('🤹GetSugestionsResolver')

    try {
      const foundSuggestions = await this.prisma.suggestion.findMany()
      console.log('suggestions in resolver', foundSuggestions)
      return foundSuggestions
    } catch (error) {
      console.error(error)
      throw new Error('Failed to find users in getTopPlanters')
    }
  }
}
