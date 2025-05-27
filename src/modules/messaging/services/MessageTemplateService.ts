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
      proposal: (productName: string, price: number, duration: string) =>
        `🛠️ **Đề xuất Custom Order**\n\nTôi có thể tạo "${productName}" cho bạn với giá $${price}, thời gian hoàn thành khoảng ${duration}.\n\nVui lòng xem chi tiết và cho tôi biết ý kiến của bạn!`,

      accepted: (productName: string) =>
        `✅ **Đề xuất được chấp nhận**\n\nCảm ơn bạn đã chấp nhận đề xuất "${productName}"! Bạn có thể tiến hành thanh toán để tôi bắt đầu thực hiện.`,

      declined: (productName: string, reason?: string) =>
        `❌ **Đề xuất bị từ chối**\n\nĐề xuất "${productName}" đã bị từ chối.${reason ? `\n\nLý do: ${reason}` : ''}`,

      changes_requested: (productName: string, changes: string) =>
        `🔄 **Yêu cầu thay đổi**\n\nKhách hàng muốn thay đổi một số điều cho "${productName}":\n\n${changes}\n\nTôi sẽ cập nhật đề xuất và gửi lại cho bạn.`,
    };
  }
}
