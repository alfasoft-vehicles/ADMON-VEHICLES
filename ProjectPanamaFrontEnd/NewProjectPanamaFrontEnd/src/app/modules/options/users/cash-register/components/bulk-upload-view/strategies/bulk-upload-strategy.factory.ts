import { Injectable } from '@angular/core';
import { BulkUploadStrategy } from './bulk-upload.strategy';
import { YappyBulkUploadStrategy } from './yappy-bulk-upload.strategy';

@Injectable({
  providedIn: 'root',
})
export class BulkUploadStrategyFactory {
  private strategies = new Map<string, BulkUploadStrategy>();

  constructor(private yappyStrategy: YappyBulkUploadStrategy) {
    this.registerStrategy(this.yappyStrategy);
  }

  /**
   * Registra una nueva estrategia de carga masiva
   */
  registerStrategy(strategy: BulkUploadStrategy): void {
    this.strategies.set(strategy.type.toLowerCase(), strategy);
  }

  /**
   * Obtiene la estrategia correspondiente al tipo especificado.
   * Si no se encuentra, retorna la estrategia por defecto (Yappy).
   */
  getStrategy(type?: string | null): BulkUploadStrategy {
    if (type) {
      const normalizedType = type.toLowerCase().trim();
      const strategy = this.strategies.get(normalizedType);
      if (strategy) {
        return strategy;
      }
      console.warn(
        `[BulkUploadStrategyFactory] No se encontró estrategia para "${type}". Usando estrategia por defecto.`,
      );
    }
    return this.yappyStrategy;
  }

  /**
   * Valida si un tipo de carga masiva tiene una estrategia registrada
   */
  hasStrategy(type: string): boolean {
    return this.strategies.has(type.toLowerCase().trim());
  }

  /**
   * Obtiene todos los tipos de estrategias registrados
   */
  getAvailableTypes(): string[] {
    return Array.from(this.strategies.keys());
  }
}
