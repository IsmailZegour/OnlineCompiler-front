import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { CodeEditorComponent } from './app/code-editor/code-editor.component';

bootstrapApplication(CodeEditorComponent, {
  providers: [
    provideRouter(routes),   // Pour les routes
    provideHttpClient(),    // Ajout du HttpClient
  ],
}).catch((err) => console.error(err));
