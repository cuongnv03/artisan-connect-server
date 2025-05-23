export class MessageTemplateService {
  static getQuoteTemplates() {
    return {
      initial_request: (productName: string, requestedPrice?: number) =>
        `Hi! I'm interested in your "${productName}"${requestedPrice ? ` but wondering if you'd consider $${requestedPrice}` : ''}. Could we discuss this?`,

      price_negotiation: (newPrice: number, reason: string) =>
        `I was thinking more along the lines of $${newPrice}. ${reason}`,

      accept_quote: () => `Perfect! I accept your quote. How do we proceed with the order?`,

      decline_quote: (reason?: string) =>
        `Thank you for the quote, but I'll have to pass${reason ? `. ${reason}` : ''}.`,

      timeline_question: () => `What would be the estimated timeline for completion?`,

      shipping_question: () => `What are the shipping options and costs?`,

      customization_request: (details: string) =>
        `Would it be possible to customize this? ${details}`,
    };
  }

  static getArtisanTemplates() {
    return {
      quote_response: (price: number, timeline: string) =>
        `Thank you for your interest! I can do this for $${price} with an estimated completion time of ${timeline}.`,

      counter_offer: (newPrice: number, reason: string) =>
        `I appreciate your interest! The best I can do is $${newPrice}. ${reason}`,

      accept_custom: () =>
        `I'd be happy to create this custom piece for you! Let me put together a detailed quote.`,

      decline_custom: (reason: string) =>
        `Thank you for thinking of me, but I won't be able to take on this custom work. ${reason}`,

      shipping_info: (cost: number, timeline: string) =>
        `Shipping would be $${cost} and typically takes ${timeline}.`,

      progress_update: (status: string) => `Quick update on your order: ${status}`,

      completion_notice: () => `Great news! Your custom piece is complete and ready to ship!`,
    };
  }

  static getCustomOrderTemplates() {
    return {
      proposal: (productName: string, description: string, price: number) =>
        `I'd like to request a custom "${productName}". ${description} My budget is around $${price}. Are you interested?`,

      specification_details: (specs: Record<string, any>) =>
        `Here are the detailed specifications:\n${Object.entries(specs)
          .map(([key, value]) => `• ${key}: ${value}`)
          .join('\n')}`,

      timeline_request: (deadline: string) =>
        `Would it be possible to complete this by ${deadline}?`,

      material_preference: (materials: string[]) =>
        `I'd prefer these materials: ${materials.join(', ')}`,

      size_specifications: (dimensions: string) => `The dimensions should be: ${dimensions}`,

      color_preference: (colors: string[]) => `Color preferences: ${colors.join(', ')}`,

      budget_discussion: (minPrice: number, maxPrice: number) =>
        `My budget range is $${minPrice} - $${maxPrice}. What's possible within this range?`,
    };
  }
}
