
export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  type?: 'proactive';
}
