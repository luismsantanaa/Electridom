import { Injectable } from '@nestjs/common';
@Injectable()
export class AiService {
  async analyze(payload: any){
    // TODO: Llamar a OpenAI con prompts en /prompts y retornar recomendaciones
    return { summary:'OK', recommendations:[] };
  }
}
