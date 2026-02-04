/**
 * Respuesta del servicio de registro de orden de pago de STP
 */
export interface OrdenPagoResponseDto {
  resultado: {
    id: number; // > 3 dígitos = folio interno STP, <= 3 dígitos = código de error
  };
}

/**
 * Respuesta estructurada del servicio
 */
export interface StpRegistraOrdenResponse {
  success: boolean;
  folioStp?: number;
  errorCode?: number;
  message: string;
  rawResponse?: any;
  // Campos de debug
  cadenaOriginal?: string;
  firma?: string;
}

