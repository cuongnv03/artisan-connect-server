import {
  GenerateTemplateDto,
  TemplateResult,
} from '../../domain/artisanProfile/entities/ArtisanProfile';
import { Logger } from '../../shared/utils/Logger';

/**
 * AI Template Service for generating store templates
 */
export class AITemplateService {
  private logger = Logger.getInstance();

  /**
   * Generate template based on artisan preferences
   */
  async generateTemplate(data: GenerateTemplateDto): Promise<TemplateResult> {
    this.logger.info(`Generating template based on style: ${data.style}`);

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate a unique ID
    const templateId = `template-${Math.random().toString(36).substring(2, 11)}`;

    // Build custom data based on preferences
    const customData = this.generateTemplateData(data);

    return {
      templateId,
      templateStyle: data.style,
      customData,
      preview: `https://example.com/template-previews/${templateId}.jpg`,
    };
  }

  /**
   * Generate template data based on preferences
   */
  private generateTemplateData(data: GenerateTemplateDto): Record<string, any> {
    const { style, preferences, description } = data;

    // Extract keywords from description
    const keywords = this.extractKeywords(description);

    // Generate color palette based on preferences
    const colorPalette = this.generateColorPalette(preferences.colorScheme || 'neutral');

    // Determine layout
    const layout = preferences.layout || 'standard';

    return {
      colorPalette,
      layout,
      emphasis: preferences.emphasis || 'balanced',
      styleElements: {
        fonts: this.getFontsForStyle(style),
        borders: this.getBordersForStyle(style),
        accents: this.getAccentsForStyle(style),
      },
      keywordEmphasis: keywords,
      sections: this.getSectionsForLayout(layout),
    };
  }

  /**
   * Extract keywords from description
   */
  private extractKeywords(description: string): string[] {
    const words = description.toLowerCase().split(/\W+/);
    const keywords = [...new Set(words.filter((word) => word.length > 5))];
    return keywords.slice(0, 5); // Return up to 5 keywords
  }

  /**
   * Generate color palette based on preference
   */
  private generateColorPalette(scheme: string): Record<string, string> {
    const palettes: Record<string, Record<string, string>> = {
      warm: {
        primary: '#e63946',
        secondary: '#f1faee',
        accent: '#a8dadc',
        background: '#f9f7f3',
        text: '#1d3557',
      },
      cool: {
        primary: '#457b9d',
        secondary: '#f1faee',
        accent: '#e63946',
        background: '#f8f9fa',
        text: '#1d3557',
      },
      earthy: {
        primary: '#606c38',
        secondary: '#fefae0',
        accent: '#dda15e',
        background: '#faedcd',
        text: '#283618',
      },
      neutral: {
        primary: '#2a9d8f',
        secondary: '#e9c46a',
        accent: '#f4a261',
        background: '#f8f9fa',
        text: '#264653',
      },
    };

    return palettes[scheme] || palettes.neutral;
  }

  /**
   * Get font settings for style
   */
  private getFontsForStyle(style: string): Record<string, string> {
    const fontSets: Record<string, Record<string, string>> = {
      modern: {
        heading: 'Montserrat, sans-serif',
        body: 'Open Sans, sans-serif',
        accent: 'Roboto, sans-serif',
      },
      traditional: {
        heading: 'Playfair Display, serif',
        body: 'Merriweather, serif',
        accent: 'Georgia, serif',
      },
      artistic: {
        heading: 'Abril Fatface, cursive',
        body: 'Lora, serif',
        accent: 'Dancing Script, cursive',
      },
      minimalist: {
        heading: 'Poppins, sans-serif',
        body: 'Work Sans, sans-serif',
        accent: 'Nunito, sans-serif',
      },
    };

    return fontSets[style] || fontSets.modern;
  }

  /**
   * Get border settings for style
   */
  private getBordersForStyle(style: string): Record<string, string> {
    const borderSets: Record<string, Record<string, string>> = {
      modern: {
        type: 'solid',
        width: '1px',
      },
      traditional: {
        type: 'double',
        width: '3px',
      },
      artistic: {
        type: 'dotted',
        width: '2px',
      },
      minimalist: {
        type: 'none',
        width: '0',
      },
    };

    return borderSets[style] || borderSets.modern;
  }

  /**
   * Get accent settings for style
   */
  private getAccentsForStyle(style: string): Record<string, boolean> {
    const accentSets: Record<string, Record<string, boolean>> = {
      modern: {
        useIcons: true,
        useAnimations: true,
        useShadows: true,
      },
      traditional: {
        useIcons: false,
        useAnimations: false,
        useShadows: true,
      },
      artistic: {
        useIcons: true,
        useAnimations: true,
        useShadows: false,
      },
      minimalist: {
        useIcons: true,
        useAnimations: false,
        useShadows: false,
      },
    };

    return accentSets[style] || accentSets.modern;
  }

  /**
   * Get sections for layout
   */
  private getSectionsForLayout(layout: string): string[] {
    const layoutSections: Record<string, string[]> = {
      standard: ['header', 'about', 'gallery', 'products', 'contact'],
      portfolio: ['hero', 'about', 'featured', 'gallery', 'testimonials', 'contact'],
      storefront: ['header', 'featured', 'categories', 'products', 'about', 'contact'],
      blog: ['header', 'about', 'posts', 'gallery', 'contact'],
    };

    return layoutSections[layout] || layoutSections.standard;
  }
}
