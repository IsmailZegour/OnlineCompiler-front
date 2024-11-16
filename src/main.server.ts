import { bootstrapApplication } from '@angular/platform-browser';
import { CodeEditorComponent } from './app/code-editor/code-editor.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

const bootstrap = () => {
    return bootstrapApplication(CodeEditorComponent, {
      providers: [
        provideRouter(routes),   // Routes pour le client et le serveur
        provideHttpClient(),    // Ajout du HttpClient pour les requêtes HTTP
      ],
    });
  };

export default bootstrap;
