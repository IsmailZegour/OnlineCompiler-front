import { Component, AfterViewInit, ElementRef, ViewChild, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { FormsModule } from '@angular/forms'; // Import FormsModule

@Component({
  selector: 'app-code-editor',
  standalone: true,
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.css'],
  imports: [
    CommonModule, // Ajout du CommonModule pour *ngIf
    FormsModule,  // Ajout du FormsModule pour ngModel
  ],
})
export class CodeEditorComponent implements AfterViewInit {
  status: 'success' | 'failed' | null = null; // Nouveau champ pour suivre l'état
  isLoading: boolean = false; // État de chargement
  @ViewChild('editorContainer', { static: false }) editorContainer!: ElementRef;

  defaultCodes: { [key: string]: string } = {
    java: `// Write your Java code here

  public class Main {
      public static void main(String[] args) {
          System.out.println("Hello, World!");
      }
  }`,
    python: `# Write your Python code here\n\nprint('Hello, World!')`,

    javascript: `// Write your JavaScript code here\n\nconsole.log('Hello, World!')`,
    c: `// Write your C code here
#include <stdio.h>
  
int main() {
  printf("Hello, World!");
  return 0;
}`
  };

  userInput: string = ''; // Champ pour les inputs utilisateur
  editor: any;
  isBrowser: boolean;
  output: string = '';

  // Ajout du langage sélectionné
  selectedLanguage: string = 'java';

  // Liste des langages disponibles
  languages: { name: string; value: string }[] = [
    { name: 'Java 17', value: 'java' },
    { name: 'Python', value: 'python' },
    { name: 'C', value: 'c' },
    { name: 'Javascript', value: 'javascript' },
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      import('monaco-editor').then((monaco) => {
        const defaultCode = this.defaultCodes[this.selectedLanguage] || ''; // Récupérer le code par défaut
        this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
          value: defaultCode, // Utiliser le code par défaut
          language: this.selectedLanguage,
          theme: 'vs-dark',
        });
      });
    }
  }

  // Méthode pour envoyer le code au backend
  sendCode(): void {
    this.isLoading = true; // Activer le statut de chargement
    const codeContent = this.editor.getValue(); // Récupérer le contenu de l'éditeur
    const payload = {
      code: codeContent,
      language: this.selectedLanguage,
      inputs: this.userInput, // Inclure les inputs utilisateur
    };

    this.http.post<{ output: string }>('http://localhost:8080/compile', payload).pipe(
      tap((response) => {
        this.output = response.output.includes('Execution failed')
          ? 'Error: Execution timed out.'
          : response.output; // Met à jour le résultat
        this.status =
          response.output.includes('failed') || response.output.includes('error')
            ? 'failed'
            : 'success'; // Vérifie si une erreur est présente
      }),
      catchError((error) => {
        if (error.error?.output?.includes('Execution failed:')) {
          this.output = 'Error: Execution timed out.';
        } else {
          this.output = (error.error?.output || error.message);
        }

        this.status = 'failed'; // Indique un échec
        return of(null); // Retourne un Observable vide pour éviter les plantages
      }),
      tap(() => {
        this.isLoading = false; // Désactiver le statut de chargement
      })
    ).subscribe(); // Exécution de l'Observable
  }

  // Méthode pour mettre à jour le langage et reconfigurer Monaco Editor
updateLanguage(): void {
  if (this.editor) {
    const defaultCode = this.defaultCodes[this.selectedLanguage] || '';
    this.editor.setValue(defaultCode); // Met à jour le contenu avec le code par défaut
    import('monaco-editor').then((monaco) => {
      monaco.editor.setModelLanguage(this.editor.getModel(), this.selectedLanguage);
    });
  }
}
}
