import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IaService, ExplainRequest, StreamResponse } from '../../services/ia.service';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
}

@Component({
  selector: 'app-chat-ia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-ia.component.html',
  styleUrls: ['./chat-ia.component.scss']
})
export class ChatIaComponent implements OnInit {
  private iaService = inject(IaService);

  // Signals
  messages = signal<ChatMessage[]>([]);
  currentQuestion = signal('');
  isLoading = signal(false);
  isStreaming = signal(false);
  currentStreamingMessage = signal('');

  // Computed
  canSendMessage = computed(() => {
    return this.currentQuestion().trim().length > 0 && !this.isLoading();
  });

  ngOnInit() {
    // Mensaje de bienvenida
    this.addMessage({
      id: 'welcome',
      content: '¡Hola! Soy Electridom, tu asistente especializado en cálculos eléctricos para la República Dominicana. ¿En qué puedo ayudarte hoy?',
      isUser: false,
      timestamp: new Date()
    });
  }

  sendMessage() {
    const question = this.currentQuestion().trim();
    if (!question || this.isLoading()) return;

    // Agregar mensaje del usuario
    this.addMessage({
      id: Date.now().toString(),
      content: question,
      isUser: true,
      timestamp: new Date()
    });

    // Limpiar input
    this.currentQuestion.set('');

    // Preparar para respuesta
    this.isLoading.set(true);
    this.isStreaming.set(true);

    // Crear mensaje de respuesta vacío
    const responseId = (Date.now() + 1).toString();
    this.addMessage({
      id: responseId,
      content: '',
      isUser: false,
      timestamp: new Date(),
      isStreaming: true
    });

    // Solicitar explicación
    const request: ExplainRequest = {
      question,
      temperature: 0.7
    };

    this.iaService.explainWithFetch(request).subscribe({
      next: (response: StreamResponse) => {
        if (response.content) {
          this.currentStreamingMessage.update(current => current + response.content);
          
          // Actualizar el mensaje en tiempo real
          this.messages.update(messages => 
            messages.map(msg => 
              msg.id === responseId 
                ? { ...msg, content: this.currentStreamingMessage() }
                : msg
            )
          );
        }

        if (response.done) {
          this.isStreaming.set(false);
          this.isLoading.set(false);
          this.currentStreamingMessage.set('');
          
          // Marcar como no streaming
          this.messages.update(messages => 
            messages.map(msg => 
              msg.id === responseId 
                ? { ...msg, isStreaming: false }
                : msg
            )
          );
        }
      },
      error: (error) => {
        console.error('Error en chat:', error);
        this.isStreaming.set(false);
        this.isLoading.set(false);
        this.currentStreamingMessage.set('');
        
        // Agregar mensaje de error
        this.addMessage({
          id: (Date.now() + 2).toString(),
          content: 'Lo siento, hubo un error al procesar tu pregunta. Por favor, intenta de nuevo.',
          isUser: false,
          timestamp: new Date()
        });
      }
    });
  }

  private addMessage(message: ChatMessage) {
    this.messages.update(messages => [...messages, message]);
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat() {
    this.messages.set([]);
    this.ngOnInit(); // Restaurar mensaje de bienvenida
  }
}
