import { Component, AfterViewInit, ElementRef, ViewChild, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import * as monaco from 'monaco-editor';
import { environment } from '../../environments/environment'; // Import des variables d'environnement


@Component({
  selector: 'app-code-editor',
  standalone: true,
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.css'],
  imports: [
    CommonModule,
    FormsModule,
  ],
})
export class CodeEditorComponent implements AfterViewInit {
  apiUrl = environment.apiUrl; // Utiliser l'URL de l'environnement

  status: 'success' | 'failed' | null = null;
  isLoading: boolean = false;
  @ViewChild('editorContainer', { static: false }) editorContainer!: ElementRef;

  defaultCodes: { [key: string]: string } = {
    java: `// Write your Java code here\n// Shortcut : type "print" for "System.out.println"

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
}`,
  };

  userInput: string = '';
  editor: any;
  isBrowser: boolean;
  output: string = '';
  executionTime: string = ''; // Temps d'exécution
  memoryUsage: string = ''; // Mémoire utilisée  apiUrl = environment.apiUrl; // Utiliser l'URL de l'environnement

  selectedLanguage: string = 'java';

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
        this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
          value: this.defaultCodes[this.selectedLanguage],
          language: this.selectedLanguage,
          theme: 'vs-dark',
          automaticLayout: true,
        });

        this.addJavaAutoCompletion(monaco);
      });
    }
  }

  sendCode(): void {
    this.isLoading = true;
    this.status = null; // Réinitialiser le status
    this.output = ''; // Réinitialiser la sortie
    const codeContent = this.editor.getValue();
    const payload = {
      code: codeContent,
      language: this.selectedLanguage,
      inputs: this.userInput,
    };

    this.http.post<{ output: string; executionTime: string; memoryUsage: string }>(`${this.apiUrl}/compile`, payload).pipe(
      tap((response) => {
        this.output = response.output;
        this.executionTime = response.executionTime;
        this.memoryUsage = response.memoryUsage;
        this.status = 'success';
      }),
      catchError((error) => {
        this.output = error.error?.output || error.message;
        this.status = 'failed';
        return of(null);
      }),
      tap(() => {
        this.isLoading = false;
      })
    ).subscribe();
  }

  updateLanguage(): void {
    if (this.editor) {
      const defaultCode = this.defaultCodes[this.selectedLanguage] || '';
      this.editor.setValue(defaultCode);
      import('monaco-editor').then((monaco) => {
        monaco.editor.setModelLanguage(this.editor.getModel(), this.selectedLanguage);
      });
    }
  }

  private addJavaAutoCompletion(monaco: typeof import('monaco-editor')): void {
    monaco.languages.registerCompletionItemProvider('java', {
      provideCompletionItems: (model, position) => {
        const wordInfo = model.getWordAtPosition(position);
        const range = wordInfo
          ? new monaco.Range(
              position.lineNumber,
              wordInfo.startColumn,
              position.lineNumber,
              wordInfo.endColumn
            )
          : new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            );

        const suggestions: monaco.languages.CompletionItem[] = [
          {
            label: 'System.out.println',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'System.out.println(${1:message});',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Prints a message to the console',
            documentation: 'Prints a message to the standard output.',
            range: range,
          },
          {
            label: 'psvm',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: `public static void main(String[] args) {\n\t$0\n}`,
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Main method',
            documentation: 'Defines the entry point for a Java application.',
            range: range,
          },
          {
            label: 'for loop',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "for (int ${1:i} = 0; ${1:i} < ${2:10}; ${1:i}++) {\n\t$0\n}",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'For loop',
            documentation: 'A simple for loop.',
            range: range,
          },
        ];

        return {
          suggestions,
        };
      },
    });
  }
}
