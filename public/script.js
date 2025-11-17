// =============================================
// CONFIGURAÇÕES E CONSTANTES
// =============================================
const CONFIG = {
  API_BASE_URL: "/api/cnpj",
  DEBOUNCE_DELAY: 300,
  REQUEST_TIMEOUT: 15000,
  MAX_RETRIES: 1
};

// =============================================
// VALIDAÇÃO DE CNPJ (ALGORITMO OFICIAL OTIMIZADO)
// =============================================
class CNPJValidator {
  static clean(cnpj) {
    return cnpj.replace(/\D/g, "");
  }

  static format(cnpj) {
    const cleaned = this.clean(cnpj);
    return cleaned.length === 14 ? 
      cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") : 
      cnpj;
  }

  static validate(cnpj) {
    const cleaned = this.clean(cnpj);
    
    if (cleaned.length !== 14) {
      return { isValid: false, error: "CNPJ deve conter 14 dígitos" };
    }

    if (/^(\d)\1+$/.test(cleaned)) {
      return { isValid: false, error: "CNPJ inválido" };
    }

    // Validação otimizada dos dígitos
    let sum = 0;
    let weight = 5;
    
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned[i]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    
    let digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    
    if (digit !== parseInt(cleaned[12])) {
      return { isValid: false, error: "CNPJ inválido" };
    }

    sum = 0;
    weight = 6;
    
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleaned[i]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    
    digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    
    if (digit !== parseInt(cleaned[13])) {
      return { isValid: false, error: "CNPJ inválido" };
    }

    return { isValid: true, cleaned };
  }
}

// =============================================
// GERENCIADOR DE ESTADO LEVE
// =============================================
class AppState {
  constructor() {
    this.currentTheme = localStorage.getItem("theme") || "dark";
    this.isLoading = false;
  }

  setTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem("theme", theme);
  }

  setLoading(loading) {
    this.isLoading = loading;
  }
}

// =============================================
// GERENCIADOR DE API OTIMIZADO
// =============================================
class ApiManager {
  static async fetchCNPJ(cnpj) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}?cnpj=${cnpj}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message);
      }

      return data.data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

// =============================================
// FORMATADORES OTIMIZADOS
// =============================================
class Formatters {
  static CNPJ(cnpj) {
    return CNPJValidator.format(cnpj);
  }

  static CEP(cep) {
    if (!cep) return "";
    const cleaned = cep.replace(/\D/g, "");
    return cleaned.length === 8 ? cleaned.replace(/(\d{5})(\d{3})/, "$1-$2") : cep;
  }

  static phone(phone) {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    
    return phone;
  }

  static date(dateString) {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("pt-BR");
    } catch {
      return dateString;
    }
  }

  static currency(value) {
    if (!value) return "0,00";
    try {
      const number = typeof value === 'string' ? 
        parseFloat(value.replace('R$', '').replace(/\./g, '').replace(',', '.')) : 
        Number(value);
      
      return number.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      return "0,00";
    }
  }
}

// =============================================
// GERENCIADOR DE UI OTIMIZADO
// =============================================
class UIManager {
  constructor() {
    this.elements = this.cacheDOMElements();
    this.debounceTimer = null;
    this.bindEvents();
  }

  cacheDOMElements() {
    // Cache de elementos DOM para acesso rápido
    return {
      cnpjInput: document.getElementById("cnpjInput"),
      searchBtn: document.getElementById("searchBtn"),
      errorMessage: document.getElementById("errorMessage"),
      loading: document.getElementById("loading"),
      result: document.getElementById("result"),
      partnersCard: document.getElementById("partnersCard"),
      partnersList: document.getElementById("partnersList"),
      themeToggle: document.getElementById("themeToggle"),
      completeData: document.getElementById("completeData"),
      companyName: document.getElementById("companyName"),
      tradeName: document.getElementById("tradeName"),
      cnpj: document.getElementById("cnpj"),
      ie: document.getElementById("ie"),
      status: document.getElementById("status"),
      address: document.getElementById("address"),
      cnae: document.getElementById("cnae"),
      phones: document.getElementById("phones"),
      email: document.getElementById("email")
    };
  }

  bindEvents() {
    // Event listeners otimizados
    this.elements.searchBtn.addEventListener("click", () => this.handleSearch());
    
    this.elements.cnpjInput.addEventListener("input", (e) => {
      this.handleInputFormat(e);
    });

    this.elements.cnpjInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleSearch();
    });

    this.elements.themeToggle.addEventListener("click", () => this.toggleTheme());

    // Delegation de eventos para tabs
    document.querySelector(".tabs").addEventListener("click", (e) => {
      if (e.target.classList.contains("tab-button")) {
        this.switchTab(e.target.dataset.tab);
      }
    });

    this.elements.cnpjInput.focus();
  }

  handleInputFormat(e) {
    const input = e.target;
    let value = input.value.replace(/\D/g, "");
    
    if (value.length <= 14) {
      if (value.length > 12) {
        value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
      } else if (value.length > 8) {
        value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, "$1.$2.$3/$4");
      } else if (value.length > 5) {
        value = value.replace(/(\d{2})(\d{3})(\d{0,3})/, "$1.$2.$3");
      } else if (value.length > 2) {
        value = value.replace(/(\d{2})(\d{0,3})/, "$1.$2");
      }
    }
    
    input.value = value;
  }

  async handleSearch() {
    const cnpjValue = this.elements.cnpjInput.value;
    
    this.clearError();
    this.hideResult();

    const validation = CNPJValidator.validate(cnpjValue);
    
    if (!validation.isValid) {
      this.showError(validation.error);
      return;
    }

    await this.searchCNPJ(validation.cleaned);
  }

  async searchCNPJ(cnpj) {
    this.showLoading();
    this.disableSearchButton(true);

    try {
      const data = await ApiManager.fetchCNPJ(cnpj);
      this.displayData(data);
    } catch (error) {
      this.showError(this.getErrorMessage(error));
    } finally {
      this.hideLoading();
      this.disableSearchButton(false);
    }
  }

  getErrorMessage(error) {
    const message = error.message || "Erro desconhecido";
    
    if (message.includes("Tempo limite")) {
      return "Consulta demorou muito tempo. Tente novamente.";
    } else if (message.includes("404") || message.includes("não encontrada")) {
      return "Empresa não encontrada para o CNPJ informado.";
    } else if (message.includes("429") || message.includes("Limite")) {
      return "Limite de consultas excedido. Tente novamente mais tarde.";
    } else if (message.includes("Failed to fetch")) {
      return "Erro de conexão. Verifique sua internet.";
    }
    
    return `Erro: ${message}`;
  }

  displayData(data) {
    if (!data?.taxId) {
      this.showError("Dados da empresa não encontrados");
      return;
    }

    // Dados básicos de forma otimizada
    this.displayBasicData(data);
    this.displayPartners(data.company?.members);
    this.displayCompleteData(data);
    this.showResult();
  }

  displayBasicData(data) {
    const elements = this.elements;
    
    elements.companyName.textContent = data.company?.name || "Não informado";
    elements.tradeName.textContent = data.alias || data.company?.name || "Não informado";
    elements.cnpj.textContent = Formatters.CNPJ(data.taxId);
    
    const iePrincipal = this.getPrincipalIE(data.registrations);
    elements.ie.textContent = iePrincipal || "Não informado";

    const statusText = data.status?.text || "Não informado";
    elements.status.textContent = statusText;
    elements.status.className = `value ${statusText.toLowerCase().includes("ativa") ? "status-active" : "status-inactive"}`;

    elements.address.textContent = this.formatAddress(data.address);
    elements.cnae.textContent = data.mainActivity?.text || "Não informado";
    elements.phones.textContent = this.formatPhones(data.phones);
    elements.email.textContent = this.getPrimaryEmail(data.emails);
  }

  getPrincipalIE(registrations) {
    if (!Array.isArray(registrations)) return null;
    const ie = registrations.find(reg => reg.type?.id === 1) || registrations[0];
    return ie ? `${ie.number} (${ie.state})` : null;
  }

  formatAddress(address) {
    if (!address) return "Não informado";
    
    const parts = [
      address.street,
      address.number,
      address.details,
      address.district,
      address.city,
      address.state
    ].filter(part => part?.trim());
    
    const formatted = parts.join(", ");
    const zip = address.zip ? ` - CEP: ${Formatters.CEP(address.zip)}` : "";
    
    return formatted + zip || "Não informado";
  }

  formatPhones(phones) {
    if (!Array.isArray(phones)) return "Não informado";
    
    const formatted = phones.map(phone => 
      phone.area && phone.number ? 
        Formatters.phone(`${phone.area}${phone.number}`) : 
        phone.number
    ).filter(phone => phone);
    
    return formatted.length > 0 ? formatted.join(", ") : "Não informado";
  }

  getPrimaryEmail(emails) {
    if (!Array.isArray(emails)) return "Não informado";
    const email = emails.find(e => e.ownership === "CORPORATE") || emails[0];
    return email?.address || "Não informado";
  }

  displayPartners(members) {
    const container = this.elements.partnersList;
    container.innerHTML = "";

    if (!Array.isArray(members) || members.length === 0) {
      this.elements.partnersCard.classList.add("hidden");
      return;
    }

    // Limitar a 6 sócios para performance
    const displayedMembers = members.slice(0, 6);
    
    // Usar DocumentFragment para inserção em lote
    const fragment = document.createDocumentFragment();
    
    displayedMembers.forEach(member => {
      const partnerElement = this.createPartnerElement(member);
      fragment.appendChild(partnerElement);
    });

    container.appendChild(fragment);
    this.elements.partnersCard.classList.remove("hidden");
  }

  createPartnerElement(member) {
    const div = document.createElement("div");
    div.className = "partner-item";
    
    div.innerHTML = `
      <div class="partner-name">${member.person?.name || "Nome não informado"}</div>
      <div class="partner-document">Cargo: ${member.role?.text || "Não informado"}</div>
      <div class="partner-qualification">Desde: ${Formatters.date(member.since) || "Data não informada"}</div>
      <div class="partner-qualification">Faixa Etária: ${member.person?.age || "Não informada"}</div>
    `;
    
    return div;
  }

  displayCompleteData(data) {
    const container = this.elements.completeData;
    
    // Limpeza eficiente
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    if (!data) {
      this.showEmptyState(container, "Nenhum dado completo disponível");
      return;
    }

    const sections = [
      this.createBasicInfoSection(data),
      this.createCompanyInfoSection(data),
      this.createAddressSection(data),
      this.createContactSection(data),
      this.createActivitiesSection(data),
      this.createPartnersSection(data)
    ].filter(section => section !== null);

    if (sections.length === 0) {
      this.showEmptyState(container, "Nenhum dado completo disponível");
      return;
    }

    // Inserção em lote
    const fragment = document.createDocumentFragment();
    sections.forEach(section => fragment.appendChild(section));
    container.appendChild(fragment);
  }

  createBasicInfoSection(data) {
    const fields = [
      { label: "CNPJ", value: Formatters.CNPJ(data.taxId) },
      { label: "Razão Social", value: data.company?.name },
      { label: "Nome Fantasia", value: data.alias },
      { label: "Data de Abertura", value: Formatters.date(data.founded) },
      { label: "Situação Cadastral", value: data.status?.text },
      { label: "Matriz/Filial", value: data.head ? "Matriz" : "Filial" }
    ].filter(field => field.value);

    return fields.length > 0 ? this.createSection("Informações Básicas", fields) : null;
  }

  createCompanyInfoSection(data) {
    const fields = [];

    if (data.company?.nature) {
      fields.push({
        label: "Natureza Jurídica",
        value: `${data.company.nature.id} - ${data.company.nature.text}`
      });
    }

    if (data.company?.equity) {
      fields.push({
        label: "Capital Social",
        value: `R$ ${Formatters.currency(data.company.equity)}`
      });
    }

    return fields.length > 0 ? this.createSection("Informações da Empresa", fields) : null;
  }

  createAddressSection(data) {
    if (!data.address) return null;

    const fields = [
      { label: "Logradouro", value: data.address.street },
      { label: "Número", value: data.address.number },
      { label: "Bairro", value: data.address.district },
      { label: "Cidade", value: data.address.city },
      { label: "Estado", value: data.address.state },
      { label: "CEP", value: Formatters.CEP(data.address.zip) }
    ].filter(field => field.value);

    return fields.length > 0 ? this.createSection("Endereço", fields) : null;
  }

  createContactSection(data) {
    const fields = [];

    if (data.phones?.length > 0) {
      const phones = data.phones.map(phone => 
        phone.area && phone.number ? 
          `Fixo: ${Formatters.phone(`${phone.area}${phone.number}`)}` : 
          `Fixo: ${phone.number}`
      ).filter(phone => !phone.includes("undefined"));
      
      if (phones.length > 0) {
        fields.push({ label: "Telefones", value: phones });
      }
    }

    if (data.emails?.length > 0) {
      const emails = data.emails.map(email => email.address);
      fields.push({ label: "E-mails", value: emails });
    }

    return fields.length > 0 ? this.createSection("Contatos", fields) : null;
  }

  createActivitiesSection(data) {
    const fields = [];

    if (data.mainActivity) {
      fields.push({
        label: "CNAE Principal",
        value: `${data.mainActivity.id} - ${data.mainActivity.text}`
      });
    }

    return fields.length > 0 ? this.createSection("Atividades Econômicas", fields) : null;
  }

  createPartnersSection(data) {
    if (!data.company?.members || data.company.members.length === 0) return null;

    const partners = data.company.members.map(member => 
      `${member.person?.name} - ${member.role?.text}`
    );

    return this.createSection("Sócios e Administradores", [
      { label: "Lista Completa", value: partners }
    ]);
  }

  createSection(title, fields) {
    const validFields = fields.filter(field => 
      field.value && 
      field.value !== "Não informado" &&
      !(Array.isArray(field.value) && field.value.length === 0)
    );

    if (validFields.length === 0) return null;

    const section = document.createElement("div");
    section.className = "info-section";

    const titleEl = document.createElement("h3");
    titleEl.className = "section-title";
    titleEl.textContent = title;
    section.appendChild(titleEl);

    validFields.forEach(field => {
      const item = this.createInfoItem(field.label, field.value);
      section.appendChild(item);
    });

    return section;
  }

  createInfoItem(label, value) {
    const item = document.createElement("div");
    item.className = "info-item";

    item.innerHTML = `
      <span class="label">${label}</span>
      <span class="value">${Array.isArray(value) ? value.map(v => `• ${v}`).join('<br>') : value}</span>
    `;

    return item;
  }

  showEmptyState(container, message) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📄</div>
        <p>${message}</p>
      </div>
    `;
  }

  // Controles de UI otimizados
  showLoading() {
    this.elements.loading.classList.remove("hidden");
  }

  hideLoading() {
    this.elements.loading.classList.add("hidden");
  }

  showResult() {
    this.elements.result.classList.remove("hidden");
  }

  hideResult() {
    this.elements.result.classList.add("hidden");
    this.elements.partnersCard.classList.add("hidden");
  }

  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.elements.errorMessage.classList.remove("hidden");
  }

  clearError() {
    this.elements.errorMessage.textContent = "";
    this.elements.errorMessage.classList.add("hidden");
  }

  disableSearchButton(disabled) {
    this.elements.searchBtn.disabled = disabled;
    const text = this.elements.searchBtn.querySelector(".button-text");
    const loading = this.elements.searchBtn.querySelector(".button-loading");

    if (disabled) {
      text.classList.add("hidden");
      loading.classList.remove("hidden");
    } else {
      text.classList.remove("hidden");
      loading.classList.add("hidden");
    }
  }

  switchTab(tabName) {
    // Atualizar botões
    document.querySelectorAll(".tab-button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    // Atualizar conteúdo
    document.querySelectorAll(".tab-pane").forEach(pane => {
      pane.classList.toggle("active", pane.id === `tab-${tabName}`);
    });
  }

  toggleTheme() {
    const isDark = document.body.classList.toggle("dark-mode");
    const icon = this.elements.themeToggle.querySelector(".theme-icon");
    
    icon.textContent = isDark ? "☀️" : "🌙";
    appState.setTheme(isDark ? "dark" : "light");
  }
}

// =============================================
// INICIALIZAÇÃO OTIMIZADA
// =============================================
let appState, uiManager;

function initializeApp() {
  appState = new AppState();
  uiManager = new UIManager();
  loadSavedTheme();
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem("theme");
  const isDark = savedTheme === "dark" || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  document.body.classList.toggle("dark-mode", isDark);
  
  const icon = document.querySelector(".theme-icon");
  if (icon) {
    icon.textContent = isDark ? "☀️" : "🌙";
  }
}

// Inicialização otimizada
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}