# Guia de Deployment - PromptsHub

## Opções de Deployment

### 1. Vercel (Recomendado para SPA)
```bash
npm install -g vercel
vercel
```

### 2. Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=.
```

### 3. GitHub Pages
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/prompts-hub.git
git push -u origin main
```

### 4. Servidor VPS (DigitalOcean, Linode, AWS)
```bash
# SSH para o servidor
ssh root@seu-servidor

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clonar repositório
git clone https://github.com/seu-usuario/prompts-hub.git
cd prompts-hub

# Instalar dependências (se houver)
npm install

# Iniciar servidor
npm start
```

### 5. Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
EXPOSE 8080
CMD ["python3", "-m", "http.server", "8080"]
```

## Variáveis de Ambiente

Criar arquivo `.env`:
```
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
API_URL=https://api.promptshub.com
```

## Checklist de Deployment

- [ ] Testar localmente
- [ ] Minificar CSS e JS
- [ ] Otimizar imagens
- [ ] Configurar CORS
- [ ] Implementar HTTPS
- [ ] Configurar CDN
- [ ] Adicionar SSL certificate
- [ ] Configurar backup automático
- [ ] Implementar monitoring
- [ ] Configurar alertas

## Monitoramento

### Ferramentas Recomendadas
- Sentry (Error tracking)
- Datadog (Monitoring)
- New Relic (Performance)
- Uptime Robot (Disponibilidade)

## Performance

### Otimizações
- Gzip compression
- Cache headers
- Lazy loading
- Code splitting
- Image optimization

### Métricas
- Lighthouse score > 90
- Core Web Vitals
- Time to First Byte < 600ms
- Largest Contentful Paint < 2.5s
