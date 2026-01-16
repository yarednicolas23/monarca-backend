import {
  IsString,
  IsNumber,
  IsOptional,
  MaxLength,
  MinLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';

/**
 * DTO para registrar una orden de pago en STP
 * Los campos siguen el orden requerido por STP para la cadena original
 */
export class OrdenPagoDto {
  @IsNumber()
  @IsNotEmpty()
  institucionContraparte: number; // Clave de la institución destino (97846 para pruebas)

  @IsString()
  @MaxLength(15)
  @IsNotEmpty()
  empresa: string; // Nombre de la empresa configurada en STP

  @IsOptional()
  @IsNumber()
  fechaOperacion?: number; // Formato AAAAMMDD (opcional, por defecto fecha actual)

  @IsOptional()
  @IsString()
  @MaxLength(50)
  folioOrigen?: string; // Folio específico de la aplicación

  @IsString()
  @MinLength(8)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'claveRastreo solo permite letras y números, sin caracteres especiales',
  })
  @IsNotEmpty()
  claveRastreo: string; // Clave única por operación y día

  @IsNumber()
  @IsNotEmpty()
  institucionOperante: number; // Clave de la institución que genera el pago (90646 para STP)

  @IsNumber()
  @IsNotEmpty()
  monto: number; // Monto máximo: 999999999999.99

  @IsNumber()
  @IsNotEmpty()
  tipoPago: number; // Tipo de pago según catálogo (1 = Tercero a Tercero)

  @IsNumber()
  @IsNotEmpty()
  tipoCuentaOrdenante: number; // Tipo cuenta ordenante según catálogo

  @IsString()
  @MaxLength(40)
  @IsNotEmpty()
  nombreOrdenante: string;

  @IsString()
  @MaxLength(20)
  @IsNotEmpty()
  cuentaOrdenante: string;

  @IsString()
  @MaxLength(18)
  @IsNotEmpty()
  rfcCurpOrdenante: string;

  @IsNumber()
  @IsNotEmpty()
  tipoCuentaBeneficiario: number; // Tipo cuenta beneficiario según catálogo

  @IsString()
  @MaxLength(40)
  @IsNotEmpty()
  nombreBeneficiario: string;

  @IsString()
  @MaxLength(20)
  @IsNotEmpty()
  cuentaBeneficiario: string; // 846180000400000001 para pruebas

  @IsString()
  @MaxLength(18)
  @IsNotEmpty()
  rfcCurpBeneficiario: string;

  @IsOptional()
  @IsString()
  emailBeneficiario?: string;

  @IsOptional()
  @IsNumber()
  tipoCuentaBeneficiario2?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  nombreBeneficiario2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cuentaBeneficiario2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(18)
  rfcCurpBeneficiario2?: string;

  @IsString()
  @MaxLength(40)
  @IsNotEmpty()
  conceptoPago: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  conceptoPago2?: string;

  @IsOptional()
  @IsNumber()
  claveCatUsuario1?: number;

  @IsOptional()
  @IsNumber()
  claveCatUsuario2?: number;

  @IsOptional()
  @IsString()
  clavePago?: string;

  @IsOptional()
  @IsString()
  referenciaCobranza?: string;

  @IsNumber()
  @IsNotEmpty()
  referenciaNumerica: number; // Referencia numérica de 7 dígitos

  @IsOptional()
  @IsString()
  tipoOperacion?: string;

  @IsOptional()
  @IsString()
  topologia?: string;

  @IsOptional()
  @IsString()
  usuario?: string;

  @IsOptional()
  @IsNumber()
  medioEntrega?: number;

  @IsOptional()
  @IsNumber()
  prioridad?: number;

  @IsOptional()
  @IsNumber()
  iva?: number;

  // Campos de Geolocalización
  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  longitud: string;

  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  latitud: string;
}

