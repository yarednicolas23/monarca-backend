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
      this.logger.log(`Cadena original: ${cadenaOriginal}`);

      // Generar la firma electrónica
      const firma = this.generarFirma(cadenaOriginal);
      this.logger.log(`Firma generada: ${firma}`);

      // Construir el payload
      const payload = this.construirPayload(ordenPago, firma);
      this.logger.log(`Payload: ${JSON.stringify(payload, null, 2)}`);

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

      const resultado = this.procesarRespuesta(response.data);
      // Agregar información de debug
      resultado.cadenaOriginal = cadenaOriginal;
      resultado.firma = firma;
      
      return resultado;
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
   * Algoritmo: SHA256 con RSA, codificado en Base64
   */
  private generarFirma(cadenaOriginal: string): string {
    try {
      // Leer la llave privada
      const privateKey = fs.readFileSync(this.privateKeyPath, 'utf8');

      // Crear el firmante con SHA256
      const sign = crypto.createSign('sha256');
      
      // Actualizar con la cadena original en UTF-8
      sign.update(cadenaOriginal, 'utf8');
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
   * IMPORTANTE: STP requiere que los valores numéricos se envíen como strings
   */
  private construirPayload(orden: OrdenPagoDto, firma: string): any {
    const payload: Record<string, string> = {};

    // Campos obligatorios - convertir a string
    payload.claveRastreo = orden.claveRastreo;
    payload.conceptoPago = orden.conceptoPago;
    payload.cuentaOrdenante = orden.cuentaOrdenante;
    payload.cuentaBeneficiario = orden.cuentaBeneficiario;
    payload.empresa = orden.empresa ?? this.empresa;
    payload.institucionContraparte = String(orden.institucionContraparte);
    payload.institucionOperante = String(orden.institucionOperante ?? this.institucionOperante);
    payload.monto = String(orden.monto);
    payload.nombreBeneficiario = orden.nombreBeneficiario;
    payload.nombreOrdenante = orden.nombreOrdenante;
    payload.referenciaNumerica = String(orden.referenciaNumerica);
    payload.rfcCurpBeneficiario = orden.rfcCurpBeneficiario;
    payload.rfcCurpOrdenante = orden.rfcCurpOrdenante;
    payload.tipoCuentaBeneficiario = String(orden.tipoCuentaBeneficiario);
    payload.tipoCuentaOrdenante = String(orden.tipoCuentaOrdenante);
    payload.tipoPago = String(orden.tipoPago);

    // Campos de geolocalización
    payload.latitud = orden.latitud;
    payload.longitud = orden.longitud;

    // Firma
    payload.firma = firma;

    // Campos opcionales - solo agregar si tienen valor
    if (orden.fechaOperacion) payload.fechaOperacion = String(orden.fechaOperacion);
    if (orden.folioOrigen) payload.folioOrigen = orden.folioOrigen;
    if (orden.emailBeneficiario) payload.emailBeneficiario = orden.emailBeneficiario;
    if (orden.tipoCuentaBeneficiario2) payload.tipoCuentaBeneficiario2 = String(orden.tipoCuentaBeneficiario2);
    if (orden.nombreBeneficiario2) payload.nombreBeneficiario2 = orden.nombreBeneficiario2;
    if (orden.cuentaBeneficiario2) payload.cuentaBeneficiario2 = orden.cuentaBeneficiario2;
    if (orden.rfcCurpBeneficiario2) payload.rfcCurpBeneficiario2 = orden.rfcCurpBeneficiario2;
    if (orden.conceptoPago2) payload.conceptoPago2 = orden.conceptoPago2;
    if (orden.claveCatUsuario1) payload.claveCatUsuario1 = String(orden.claveCatUsuario1);
    if (orden.claveCatUsuario2) payload.claveCatUsuario2 = String(orden.claveCatUsuario2);
    if (orden.clavePago) payload.clavePago = orden.clavePago;
    if (orden.referenciaCobranza) payload.referenciaCobranza = orden.referenciaCobranza;
    if (orden.tipoOperacion) payload.tipoOperacion = orden.tipoOperacion;
    if (orden.topologia) payload.topologia = orden.topologia;
    if (orden.usuario) payload.usuario = orden.usuario;
    if (orden.medioEntrega) payload.medioEntrega = String(orden.medioEntrega);
    if (orden.prioridad) payload.prioridad = String(orden.prioridad);
    if (orden.iva) payload.iva = String(orden.iva);

    return payload;
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

