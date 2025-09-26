# 🚀 Como Subir o Projeto para o GitHub

## Passo 1: Criar o Repositório no GitHub

1. Acesse: https://github.com
2. Faça login na sua conta
3. Clique no botão **"+"** no canto superior direito
4. Selecione **"New repository"**
5. Preencha os dados:
   - **Repository name**: `gestor-de-importacao`
   - **Description**: `Sistema web para gestão de estoque e vendas de produtos importados`
   - **Visibility**: Public (ou Private se preferir)
   - **NÃO** marque "Add a README file" (já temos um)
   - **NÃO** marque "Add .gitignore" (já temos um)
   - **NÃO** marque "Choose a license"
6. Clique em **"Create repository"**

## Passo 2: Comandos para Executar

Após criar o repositório no GitHub, execute os comandos abaixo no terminal:

```bash
# Adicionar o repositório remoto (substitua SEU-USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU-USUARIO/gestor-de-importacao.git

# Renomear branch para main (padrão atual do GitHub)
git branch -M main

# Fazer push do código
git push -u origin main
```

## Passo 3: Verificar

Após executar os comandos, acesse o repositório no GitHub para confirmar que todos os arquivos foram enviados corretamente.

## 📁 Arquivos que serão enviados:

- ✅ index.html (aplicação principal)
- ✅ styles.css (estilos)
- ✅ script.js (lógica)
- ✅ README.md (documentação)
- ✅ .gitignore (arquivos ignorados)

## 🎯 Próximos Passos (Opcional):

1. **GitHub Pages**: Habilitar para hospedar o site gratuitamente
2. **Releases**: Criar versões do projeto
3. **Issues**: Adicionar funcionalidades futuras
4. **Wiki**: Documentação adicional

---

**Nota**: Lembre-se de substituir `SEU-USUARIO` pelo seu nome de usuário real do GitHub!