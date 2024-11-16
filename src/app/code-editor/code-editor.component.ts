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

  @ViewChild('editorContainer', { static: false }) editorContainer!: ElementRef;

  code: string = `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`;

  editor: any;
  isBrowser: boolean;
  output: string = '';

  // Ajout du langage sélectionné
  selectedLanguage: string = 'java';

  // Liste des langages disponibles
  languages: { name: string; value: string }[] = [
    { name: 'Java', value: 'java' },
    { name: 'Python', value: 'python' },
    { name: 'C', value: 'c' },
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
        this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
          value: this.code,
          language: this.selectedLanguage,
          theme: 'vs-dark',
        });
      });
    }
  }

  // Méthode pour envoyer le code au backend
  sendCode(): void {
    const codeContent = this.editor.getValue(); // Récupérer le contenu de l'éditeur
    const payload = { code: codeContent, language: this.selectedLanguage }; // Inclure le langage
    
    this.http.post<{ output: string }>('http://localhost:8080/compile', payload).pipe(
      tap((response) => {
        this.output = response.output; // Met à jour le résultat
        this.status = response.output.includes("Compilation failed") || response.output.includes("error")
          ? 'failed'
          : 'success'; // Vérifie si une erreur est présente
      }),
      catchError((error) => {
        this.output = error.error.output || 'An error occurred.';
        this.status = 'failed'; // Indique un échec
        return of(null); // Retourne un Observable vide pour éviter les plantages
      })
    ).subscribe(); // Exécution de l'Observable
  }
  

  // Méthode pour mettre à jour le langage et reconfigurer Monaco Editor
  updateLanguage(): void {
    if (this.editor) {
      this.editor.dispose(); // Supprimer l'éditeur existant
      import('monaco-editor').then((monaco) => {
        this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
          value: this.code,
          language: this.selectedLanguage,
          theme: 'vs-dark',
        });
      });
    }
  }
}
