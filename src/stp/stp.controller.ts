import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { StpService } from './stp.service';
import { OrdenPagoDto } from './dto/orden-pago.dto';
import { StpRegistraOrdenResponse } from './dto/orden-pago-response.dto';

@Controller('stp')
export class StpController {
  private readonly logger = new Logger(StpController.name);

  constructor(private readonly stpService: StpService) {}

  /**
   * Registra una orden de pago en STP
   * POST /stp/orden-pago
   */
  @Post('orden-pago')
  @HttpCode(HttpStatus.OK)
  async registrarOrdenPago(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    ordenPago: OrdenPagoDto,
  ): Promise<StpRegistraOrdenResponse> {
    this.logger.log(`Registrando orden de pago: ${ordenPago.claveRastreo}`);
    return this.stpService.registrarOrdenPago(ordenPago);
  }
}

