import { Component, AfterViewInit, ElementRef, ViewChild, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { catchError, of, tap } from 'rxjs';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.css'],
  imports: [
    CommonModule, // Ajout du CommonModule pour *ngIf
  ],
})
export class CodeEditorComponent implements AfterViewInit {
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
          language: 'java',
          theme: 'vs-dark',
        });
      });
    }
  }

  sendCode(): void {
    const codeContent = this.editor.getValue(); // Récupérer le contenu de l'éditeur
    const payload = { code: codeContent };
  
    this.http.post<{ output: string }>('http://localhost:8080/compile', payload).pipe(
      tap((response) => {
        this.output = response.output; // Mise à jour du résultat
      }),
      catchError((error) => {
        this.output = 'Erreur lors de l’exécution du code : ' + error.message;
        return of(null); // Retourner un Observable vide pour gérer l'erreur proprement
      })
    ).subscribe(); // Exécution de l'Observable
  }
}
