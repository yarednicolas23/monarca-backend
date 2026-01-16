import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { OrdenPagoDto } from './dto/orden-pago.dto';
import { StpRegistraOrdenResponse } from './dto/orden-pago-response.dto';

@Injectable()
export class StpService {
  private readonly logger = new Logger(StpService.name);
  private readonly baseUrl: string;
  private readonly empresa: string;
  private readonly privateKeyPath: string;
  private readonly privateKeyPassphrase: string;
  private readonly institucionOperante: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('STP_BASE_URL', 'https://demo.stpmex.com:7024');
    this.empresa = this.configService.get<string>('STP_EMPRESA', '');
    this.privateKeyPath = this.configService.get<string>('STP_PRIVATE_KEY_PATH', '');
    this.privateKeyPassphrase = this.configService.get<string>('STP_PRIVATE_KEY_PASSPHRASE', '');
    this.institucionOperante = this.configService.get<number>('STP_INSTITUCION_OPERANTE', 90646);
  }

  /**
   * Registra una orden de pago en STP
   * Endpoint REST: PUT /speiws/rest/ordenPago/registra
   */
  async registrarOrdenPago(ordenPago: OrdenPagoDto): Promise<StpRegistraOrdenResponse> {
    try {
      // Construir la cadena original
      const cadenaOriginal = this.construirCadenaOriginal(ordenPago);
      this.logger.debug(`Cadena original: ${cadenaOriginal}`);

      // Generar la firma electrónica
      const firma = this.generarFirma(cadenaOriginal);
      this.logger.debug(`Firma generada: ${firma.substring(0, 50)}...`);

      // Construir el payload
      const payload = this.construirPayload(ordenPago, firma);

      // Realizar la petición PUT
      const url = `${this.baseUrl}/speiws/rest/ordenPago/registra`;
      this.logger.log(`Enviando orden de pago a: ${url}`);

      const response = await firstValueFrom(
        this.httpService.put(url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Encoding': 'UTF-8',
          },
        }),
      );

      this.logger.log(`Respuesta de STP: ${JSON.stringify(response.data)}`);

      return this.procesarRespuesta(response.data);
    } catch (error) {
      this.logger.error(`Error al registrar orden de pago: ${error.message}`, error.stack);
      
      if (error.response) {
        this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
        return {
          success: false,
          errorCode: error.response.status,
          message: `Error de STP: ${JSON.stringify(error.response.data)}`,
          rawResponse: error.response.data,
        };
      }

      return {
        success: false,
        message: `Error al conectar con STP: ${error.message}`,
      };
    }
  }

  /**
   * Construye la cadena original en el orden requerido por STP
   * ||institucionContraparte|empresa|fechaOperacion|folioOrigen|claveRastreo|...||
   */
  private construirCadenaOriginal(orden: OrdenPagoDto): string {
    const campos = [
      orden.institucionContraparte ?? '',
      orden.empresa ?? this.empresa,
      orden.fechaOperacion ?? '',
      orden.folioOrigen ?? '',
      orden.claveRastreo ?? '',
      orden.institucionOperante ?? this.institucionOperante,
      orden.monto ?? '',
      orden.tipoPago ?? '',
      orden.tipoCuentaOrdenante ?? '',
      orden.nombreOrdenante ?? '',
      orden.cuentaOrdenante ?? '',
      orden.rfcCurpOrdenante ?? '',
      orden.tipoCuentaBeneficiario ?? '',
      orden.nombreBeneficiario ?? '',
      orden.cuentaBeneficiario ?? '',
      orden.rfcCurpBeneficiario ?? '',
      orden.emailBeneficiario ?? '',
      orden.tipoCuentaBeneficiario2 ?? '',
      orden.nombreBeneficiario2 ?? '',
      orden.cuentaBeneficiario2 ?? '',
      orden.rfcCurpBeneficiario2 ?? '',
      orden.conceptoPago ?? '',
      orden.conceptoPago2 ?? '',
      orden.claveCatUsuario1 ?? '',
      orden.claveCatUsuario2 ?? '',
      orden.clavePago ?? '',
      orden.referenciaCobranza ?? '',
      orden.referenciaNumerica ?? '',
      orden.tipoOperacion ?? '',
      orden.topologia ?? '',
      orden.usuario ?? '',
      orden.medioEntrega ?? '',
      orden.prioridad ?? '',
      orden.iva ?? '',
    ];

    return `||${campos.join('|')}||`;
  }

  /**
   * Genera la firma electrónica usando la llave privada
   * Algoritmo: RSA-SHA256, codificado en Base64
   */
  private generarFirma(cadenaOriginal: string): string {
    try {
      // Leer la llave privada
      const privateKey = fs.readFileSync(this.privateKeyPath, 'utf8');

      // Crear el firmante
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(cadenaOriginal);
      sign.end();

      // Firmar con la llave privada
      const firma = sign.sign(
        {
          key: privateKey,
          passphrase: this.privateKeyPassphrase || undefined,
        },
        'base64',
      );

      return firma;
    } catch (error) {
      this.logger.error(`Error al generar firma: ${error.message}`);
      throw new Error(`Error al generar firma electrónica: ${error.message}`);
    }
  }

  /**
   * Construye el payload para la petición REST
   */
  private construirPayload(orden: OrdenPagoDto, firma: string): any {
    return {
      institucionContraparte: orden.institucionContraparte,
      empresa: orden.empresa ?? this.empresa,
      fechaOperacion: orden.fechaOperacion,
      folioOrigen: orden.folioOrigen,
      claveRastreo: orden.claveRastreo,
      institucionOperante: orden.institucionOperante ?? this.institucionOperante,
      monto: orden.monto,
      tipoPago: orden.tipoPago,
      tipoCuentaOrdenante: orden.tipoCuentaOrdenante,
      nombreOrdenante: orden.nombreOrdenante,
      cuentaOrdenante: orden.cuentaOrdenante,
      rfcCurpOrdenante: orden.rfcCurpOrdenante,
      tipoCuentaBeneficiario: orden.tipoCuentaBeneficiario,
      nombreBeneficiario: orden.nombreBeneficiario,
      cuentaBeneficiario: orden.cuentaBeneficiario,
      rfcCurpBeneficiario: orden.rfcCurpBeneficiario,
      emailBeneficiario: orden.emailBeneficiario,
      tipoCuentaBeneficiario2: orden.tipoCuentaBeneficiario2,
      nombreBeneficiario2: orden.nombreBeneficiario2,
      cuentaBeneficiario2: orden.cuentaBeneficiario2,
      rfcCurpBeneficiario2: orden.rfcCurpBeneficiario2,
      conceptoPago: orden.conceptoPago,
      conceptoPago2: orden.conceptoPago2,
      claveCatUsuario1: orden.claveCatUsuario1,
      claveCatUsuario2: orden.claveCatUsuario2,
      clavePago: orden.clavePago,
      referenciaCobranza: orden.referenciaCobranza,
      referenciaNumerica: orden.referenciaNumerica,
      tipoOperacion: orden.tipoOperacion,
      topologia: orden.topologia,
      usuario: orden.usuario,
      medioEntrega: orden.medioEntrega,
      prioridad: orden.prioridad,
      iva: orden.iva,
      longitud: orden.longitud,
      latitud: orden.latitud,
      firma: firma,
    };
  }

  /**
   * Procesa la respuesta de STP
   * id > 3 dígitos = folio interno STP (éxito)
   * id <= 3 dígitos = código de error
   */
  private procesarRespuesta(data: any): StpRegistraOrdenResponse {
    const id = data?.resultado?.id ?? data?.id;

    if (id === undefined || id === null) {
      return {
        success: false,
        message: 'Respuesta inválida de STP',
        rawResponse: data,
      };
    }

    // Si el id tiene más de 3 dígitos, es el folio interno de STP (éxito)
    if (id > 999) {
      return {
        success: true,
        folioStp: id,
        message: 'Orden de pago registrada exitosamente',
        rawResponse: data,
      };
    }

    // Si tiene 3 dígitos o menos, es un código de error
    return {
      success: false,
      errorCode: id,
      message: this.obtenerMensajeError(id),
      rawResponse: data,
    };
  }

  /**
   * Obtiene el mensaje de error basado en el código
   */
  private obtenerMensajeError(codigo: number): string {
    const errores: Record<number, string> = {
      0: 'Error general',
      1: 'Firma electrónica inválida',
      2: 'Empresa no válida',
      3: 'Institución contraparte no válida',
      4: 'Cuenta ordenante no válida',
      5: 'Cuenta beneficiario no válida',
      6: 'Tipo de cuenta no válido',
      7: 'Monto no válido',
      8: 'Fecha de operación no válida',
      9: 'Clave de rastreo duplicada',
      10: 'RFC/CURP no válido',
      // Agrega más códigos según la documentación de STP
    };

    return errores[codigo] ?? `Error desconocido (código: ${codigo})`;
  }
}

