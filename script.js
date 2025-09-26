/**
 * Gestor de Importação - JavaScript Principal
 * Sistema de gestão de estoque e vendas para produtos importados
 */

document.addEventListener('DOMContentLoaded', function() {
    // Estado da aplicação
    let inventory = [];
    let soldItems = [];
    let lastCalculation = {};
    let myPieChart = null;
    
    // Constantes
    const ML_FEES = { 
        none: 0, 
        classico: 0.14, 
        premium: 0.19 
    };

    // Seletores de elementos DOM
    const selectors = {
        tabs: document.querySelectorAll('.tab-button'),
        tabContents: document.querySelectorAll('.tab-content'),
        productModel: document.getElementById('product-model'),
        productCategory: document.getElementById('product-category'),
        searchPriceBtn: document.getElementById('search-price-btn'),
        marketPriceResult: document.getElementById('market-price-result'),
        productValue: document.getElementById('product-value'),
        productValueCurrency: document.getElementById('product-value-currency'),
        usCloserFreightUSD: document.getElementById('us-closer-freight-usd'),
        dollarRate: document.getElementById('dollar-rate'),
        brazilFreight: document.getElementById('brazil-freight'),
        brazilFreightCurrency: document.getElementById('brazil-freight-currency'),
        importTaxBRL: document.getElementById('import-tax-brl'),
        calculateCostBtn: document.getElementById('calculate-cost-btn'),
        calculatorResultArea: document.getElementById('calculator-result-area'),
        profitSimulatorArea: document.getElementById('profit-simulator-area'),
        simSellPrice: document.getElementById('sim-sell-price'),
        simMlFeeType: document.getElementById('sim-ml-fee-type'),
        simulateProfitBtn: document.getElementById('simulate-profit-btn'),
        profitSimulationResult: document.getElementById('profit-simulation-result'),
        addToStockBtn: document.getElementById('add-to-stock-btn'),
        inventoryTableBody: document.getElementById('inventory-table-body'),
        soldTableBody: document.getElementById('sold-table-body'),
        noInventory: document.getElementById('no-inventory'),
        noSoldItems: document.getElementById('no-sold-items'),
        yearFilter: document.getElementById('year-filter'),
        monthFilter: document.getElementById('month-filter'),
        pieChartContainer: document.getElementById('pie-chart-container'),
        addStockModal: document.getElementById('add-stock-modal'),
        sellItemModal: document.getElementById('sell-item-modal'),
        detailsModal: document.getElementById('details-modal'),
        editStockModal: document.getElementById('edit-stock-modal'),
        editSaleModal: document.getElementById('edit-sale-modal'),
        closeButtons: document.querySelectorAll('.close-button'),
        addStockForm: document.getElementById('add-stock-form'),
        itemIdentifier: document.getElementById('item-identifier'),
        itemQuantity: document.getElementById('item-quantity'),
        sellItemForm: document.getElementById('sell-item-form'),
        sellItemId: document.getElementById('sell-item-id'),
        sellPrice: document.getElementById('sell-price'),
        sellChannel: document.getElementById('sell-channel'),
        sellDate: document.getElementById('sell-date'),
        editStockForm: document.getElementById('edit-stock-form'),
        editSaleForm: document.getElementById('edit-sale-form'),
        exportBtn: document.getElementById('export-btn'),
        importBtn: document.getElementById('import-btn'),
        importFileInput: document.getElementById('import-file-input')
    };

    // Funções utilitárias
    function saveData() {
        localStorage.setItem('inventory', JSON.stringify(inventory));
        localStorage.setItem('soldItems', JSON.stringify(soldItems));
    }

    function loadData() {
        inventory = JSON.parse(localStorage.getItem('inventory')) || [];
        soldItems = JSON.parse(localStorage.getItem('soldItems')) || [];
    }

    function formatCurrency(value, currency = 'BRL') {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency
        }).format(value);
    }

    function openModal(modal) {
        modal.style.display = 'block';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
    }

    // Funções de renderização
    function renderAll() {
        const selectedYear = selectors.yearFilter.value;
        const selectedMonth = selectors.monthFilter.value;
        
        const filteredSoldItems = soldItems.filter(item => {
            if (!item.sellDate) return false;
            const saleDate = new Date(item.sellDate + 'T00:00:00');
            const yearMatch = selectedYear === 'all' || saleDate.getFullYear() == selectedYear;
            const monthMatch = selectedMonth === 'all' || saleDate.getMonth() == selectedMonth;
            return yearMatch && monthMatch;
        });
        
        renderInventory();
        renderSoldItems();
        renderDashboard(filteredSoldItems);
    }
    
    function renderInventory() {
        selectors.inventoryTableBody.innerHTML = '';
        selectors.noInventory.style.display = inventory.length === 0 ? 'block' : 'none';
        
        inventory.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.identifier}</td>
                <td>${item.category}</td>
                <td>${item.model}</td>
                <td>${formatCurrency(item.totalCostBRL)}</td>
                <td class="actions-cell">
                    <button class="btn btn-small btn-info details-btn" data-id="${item.id}">Detalhes</button>
                    <button class="btn btn-small btn-warning edit-stock-btn" data-id="${item.id}">Editar</button>
                    <button class="btn btn-small btn-success sell-btn" data-id="${item.id}">Vender</button>
                    <button class="btn btn-small btn-danger delete-stock-btn" data-id="${item.id}">Excluir</button>
                </td>
            `;
            selectors.inventoryTableBody.appendChild(row);
        });
    }

    function renderSoldItems() {
        selectors.soldTableBody.innerHTML = '';
        selectors.noSoldItems.style.display = soldItems.length === 0 ? 'block' : 'none';
        
        // Ordenar por data de venda (mais recente primeiro)
        soldItems.sort((a, b) => new Date(b.sellDate) - new Date(a.sellDate));
        
        soldItems.forEach(item => {
            const profit = item.sellPrice - item.totalCostBRL;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.model}</td>
                <td>${formatCurrency(item.totalCostBRL)}</td>
                <td>${formatCurrency(item.sellPrice)}</td>
                <td>${item.sellChannel}</td>
                <td class="${profit >= 0 ? 'profit' : 'loss'}">${formatCurrency(profit)}</td>
                <td class="actions-cell">
                    <button class="btn btn-small btn-warning edit-sale-btn" data-id="${item.id}">Editar</button>
                    <button class="btn btn-small btn-danger delete-sale-btn" data-id="${item.id}">Excluir</button>
                </td>
            `;
            selectors.soldTableBody.appendChild(row);
        });
    }

    function renderDashboard(filteredItems) {
        const totalProfit = filteredItems.reduce((acc, item) => acc + (item.sellPrice - item.totalCostBRL), 0);
        const itemsSoldCount = filteredItems.length;
        const avgProfit = itemsSoldCount > 0 ? totalProfit / itemsSoldCount : 0;
        const stockValue = inventory.reduce((acc, item) => acc + item.totalCostBRL, 0);

        document.getElementById('db-total-profit').textContent = formatCurrency(totalProfit);
        document.getElementById('db-total-profit').className = `card-value ${totalProfit >= 0 ? 'profit' : 'loss'}`;
        document.getElementById('db-items-sold').textContent = itemsSoldCount;
        document.getElementById('db-avg-profit').textContent = formatCurrency(avgProfit);
        document.getElementById('db-stock-value').textContent = formatCurrency(stockValue);

        renderPieChart(filteredItems);
    }

    function renderPieChart(data) {
        selectors.pieChartContainer.style.display = data.length > 0 ? 'block' : 'none';
        
        if (data.length === 0) {
            if (myPieChart) myPieChart.destroy();
            return;
        }

        const ctx = document.getElementById('productPieChart').getContext('2d');
        const salesByCategory = data.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
        }, {});

        if (myPieChart) myPieChart.destroy();

        myPieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(salesByCategory),
                datasets: [{
                    data: Object.values(salesByCategory),
                    backgroundColor: ['#00D18F', '#00A3FF', '#FFA726', '#FF5252', '#9E9E9E', '#7E57C2'],
                    borderColor: 'var(--surface-color)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: 'white'
                        }
                    }
                }
            }
        });
    }

    function populateDateFilters() {
        const currentYear = new Date().getFullYear();
        
        // Popular filtro de anos
        selectors.yearFilter.innerHTML = '<option value="all">Todos os Anos</option>';
        for (let year = currentYear; year >= 2023; year--) {
            selectors.yearFilter.innerHTML += `<option value="${year}">${year}</option>`;
        }
        
        // Popular filtro de meses
        const months = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        selectors.monthFilter.innerHTML = '<option value="all">Ano Inteiro</option>';
        months.forEach((month, index) => {
            selectors.monthFilter.innerHTML += `<option value="${index}">${month}</option>`;
        });
        
        // Definir ano atual como padrão
        selectors.yearFilter.value = currentYear;
        selectors.monthFilter.value = 'all';
    }
    
    // Função para buscar cotação do dólar
    async function fetchDollarRate() {
        try {
            const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
            const data = await response.json();
            const dollarValue = parseFloat(data.USDBRL.bid);
            // Adicionar 2% de spread
            selectors.dollarRate.value = (dollarValue * 1.02).toFixed(2);
        } catch (error) {
            selectors.dollarRate.placeholder = 'Falha ao buscar. Digite.';
        }
    }

    // Event Listeners - Sistema de abas
    selectors.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            selectors.tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            selectors.tabContents.forEach(c => c.classList.remove('active'));
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Event Listeners - Modais
    selectors.closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });

    window.onclick = function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = "none";
        }
    }
    
    // Event Listeners - Pesquisa de preços
    selectors.searchPriceBtn.addEventListener('click', () => {
        const model = selectors.productModel.value.trim();
        if (model === '') {
            alert('Digite um modelo para pesquisar.');
            return;
        }

        const encodedModel = encodeURIComponent(model);
        selectors.marketPriceResult.innerHTML = `
            <p style="margin-bottom:10px;">Clique para pesquisar:</p>
            <div style="display:flex; flex-wrap:wrap; gap:10px;">
                <a href="https://lista.mercadolivre.com.br/${encodedModel}" target="_blank" class="btn btn-small btn-secondary">Mercado Livre</a>
                <a href="https://www.olx.com.br/brasil?q=${encodedModel}" target="_blank" class="btn btn-small btn-secondary">OLX</a>
            </div>
        `;
        selectors.marketPriceResult.style.display = 'block';
    });
    
    // Event Listeners - Calculadora de custos
    selectors.calculateCostBtn.addEventListener('click', () => {
        const model = selectors.productModel.value;
        const category = selectors.productCategory.value;
        const rate = parseFloat(selectors.dollarRate.value);
        
        if (!model || !rate) {
            alert('Preencha o Modelo e a Cotação do Dólar.');
            return;
        }
        
        let costInUSD = 0;
        let costInBRL = 0;
        
        // Valor do produto
        const productValue = parseFloat(selectors.productValue.value) || 0;
        if (selectors.productValueCurrency.value === 'USD') {
            costInUSD += productValue;
        } else {
            costInBRL += productValue;
        }
        
        // Frete US Closer
        costInUSD += parseFloat(selectors.usCloserFreightUSD.value) || 0;
        
        // Frete para o Brasil
        const brazilFreight = parseFloat(selectors.brazilFreight.value) || 0;
        if (selectors.brazilFreightCurrency.value === 'USD') {
            costInUSD += brazilFreight;
        } else {
            costInBRL += brazilFreight;
        }
        
        // Taxa de importação
        costInBRL += parseFloat(selectors.importTaxBRL.value) || 0;
        
        // Cálculo final
        const totalCostBRL = (costInUSD * rate) + costInBRL;

        // Salvar cálculo
        lastCalculation = {
            model,
            category,
            productValue,
            productValueCurrency: selectors.productValueCurrency.value,
            usCloserFreightUSD: parseFloat(selectors.usCloserFreightUSD.value) || 0,
            rate,
            brazilFreight,
            brazilFreightCurrency: selectors.brazilFreightCurrency.value,
            importTaxBRL: parseFloat(selectors.importTaxBRL.value) || 0,
            totalCostBRL
        };
        
        // Mostrar resultado
        selectors.calculatorResultArea.innerHTML = `
            Custo Total Estimado: <strong style="color: var(--accent-color);">${formatCurrency(totalCostBRL)}</strong>
        `;
        selectors.calculatorResultArea.style.display = 'block';
        selectors.profitSimulatorArea.style.display = 'block';
    });
    
    // Event Listeners - Simulador de lucro
    selectors.simulateProfitBtn.addEventListener('click', () => {
        const cost = lastCalculation.totalCostBRL;
        if (cost === undefined) {
            alert('Primeiro, calcule o custo total.');
            return;
        }

        const price = parseFloat(selectors.simSellPrice.value);
        if (!price) {
            alert('Digite um preço de venda para simular.');
            return;
        }

        const feeType = selectors.simMlFeeType.value;
        const feePercentage = ML_FEES[feeType];
        
        const directProfit = price - cost;
        const mlFee = price * feePercentage;
        const netReceived = price - mlFee;
        const profitWithML = netReceived - cost;

        let profitHTML = `
            <strong>Preço de Venda:</strong> ${formatCurrency(price)}<br>
            <strong>Custo do Produto:</strong> - ${formatCurrency(cost)}<br>
            <strong>Lucro na Venda Direta: <span class="${directProfit >= 0 ? 'profit' : 'loss'}">${formatCurrency(directProfit)}</span></strong>
            <hr style="border-color: var(--border-color);">
        `;

        if (feeType !== 'none') {
            profitHTML += `
                <strong>Taxa do Anúncio (${feeType}):</strong> <span class="loss">- ${formatCurrency(mlFee)}</span><br>
                <strong>Valor Líquido Recebido:</strong> ${formatCurrency(netReceived)}<br>
                <strong>Lucro Final no Mercado Livre: <span class="${profitWithML >= 0 ? 'profit' : 'loss'}">${formatCurrency(profitWithML)}</span></strong>
            `;
        }

        selectors.profitSimulationResult.innerHTML = profitHTML;
        selectors.profitSimulationResult.style.display = 'block';
    });

    // Event Listeners - Adicionar ao estoque
    selectors.addToStockBtn.addEventListener('click', () => {
        if (lastCalculation.totalCostBRL === undefined) {
            alert('Calcule o custo antes de adicionar.');
            return;
        }
        selectors.itemIdentifier.value = '';
        selectors.itemQuantity.value = 1;
        openModal(selectors.addStockModal);
    });

    selectors.addStockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const quantity = parseInt(selectors.itemQuantity.value, 10) || 1;
        const baseIdentifier = selectors.itemIdentifier.value;

        for (let i = 1; i <= quantity; i++) {
            const uniqueIdentifier = quantity > 1 ? `${baseIdentifier} #${i}` : baseIdentifier;
            const uniqueId = Date.now() + i;
            
            const newItem = {
                ...lastCalculation,
                id: uniqueId,
                identifier: uniqueIdentifier
            };
            
            inventory.push(newItem);
        }

        saveData();
        renderAll();
        closeModal(selectors.addStockModal);
        alert(`${quantity} item(s) adicionado(s) ao estoque com sucesso!`);
    });

    // Event Listeners - Ações do estoque
    selectors.inventoryTableBody.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        const target = e.target;

        if (target.classList.contains('details-btn')) {
            const item = inventory.find(i => i.id === id);
            document.getElementById('details-modal-title').textContent = `Detalhes de: ${item.model}`;
            document.getElementById('details-modal-body').innerHTML = `
                <p><strong>Custo Total:</strong> ${formatCurrency(item.totalCostBRL)}</p>
                <hr>
                <p><strong>Valor Produto:</strong> ${formatCurrency(item.productValue, item.productValueCurrency)}</p>
                <p><strong>Frete US:</strong> ${formatCurrency(item.usCloserFreightUSD, 'USD')}</p>
                <p><strong>Cotação:</strong> R$ ${item.rate.toFixed(2)}</p>
                <p><strong>Frete BR:</strong> ${formatCurrency(item.brazilFreight, item.brazilFreightCurrency)}</p>
                <p><strong>Taxa:</strong> ${formatCurrency(item.importTaxBRL)}</p>
            `;
            openModal(selectors.detailsModal);
        }

        if (target.classList.contains('edit-stock-btn')) {
            const item = inventory.find(i => i.id === id);
            document.getElementById('edit-stock-id').value = item.id;
            document.getElementById('edit-product-model').value = item.model;
            document.getElementById('edit-product-category').value = item.category;
            document.getElementById('edit-product-value-usd').value = item.productValue;
            document.getElementById('edit-us-closer-freight-usd').value = item.usCloserFreightUSD;
            document.getElementById('edit-dollar-rate').value = item.rate;
            document.getElementById('edit-brazil-freight-brl').value = item.brazilFreight;
            document.getElementById('edit-import-tax-brl').value = item.importTaxBRL;
            openModal(selectors.editStockModal);
        }

        if (target.classList.contains('sell-btn')) {
            selectors.sellItemId.value = id;
            selectors.sellDate.valueAsDate = new Date();
            openModal(selectors.sellItemModal);
        }

        if (target.classList.contains('delete-stock-btn')) {
            if (confirm('Tem certeza que deseja excluir este item do estoque? Esta ação não pode ser desfeita.')) {
                inventory = inventory.filter(item => item.id !== id);
                saveData();
                renderAll();
            }
        }
    });
    
    // Event Listeners - Editar estoque
    selectors.editStockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = parseInt(document.getElementById('edit-stock-id').value);
        const index = inventory.findIndex(i => i.id === id);
        if (index === -1) return;

        const value = parseFloat(document.getElementById('edit-product-value-usd').value);
        const freightUS = parseFloat(document.getElementById('edit-us-closer-freight-usd').value) || 0;
        const rate = parseFloat(document.getElementById('edit-dollar-rate').value);
        const freightBR = parseFloat(document.getElementById('edit-brazil-freight-brl').value) || 0;
        const taxBR = parseFloat(document.getElementById('edit-import-tax-brl').value);
        
        // Cálculo simplificado - idealmente deveria considerar as moedas
        const totalCostBRL = (value + freightUS) * rate + freightBR + taxBR;

        inventory[index] = {
            ...inventory[index],
            model: document.getElementById('edit-product-model').value,
            category: document.getElementById('edit-product-category').value,
            productValue: value,
            usCloserFreightUSD: freightUS,
            rate,
            brazilFreight: freightBR,
            importTaxBRL: taxBR,
            totalCostBRL
        };

        saveData();
        renderAll();
        closeModal(selectors.editStockModal);
    });

    // Event Listeners - Vender item
    selectors.sellItemForm.addEventListener('submit', e => {
        e.preventDefault();
        
        const id = parseInt(selectors.sellItemId.value);
        const itemToSell = inventory.find(item => item.id === id);
        
        const soldItem = {
            ...itemToSell,
            sellPrice: parseFloat(selectors.sellPrice.value),
            sellChannel: selectors.sellChannel.value,
            sellDate: selectors.sellDate.value
        };
        
        soldItems.push(soldItem);
        inventory = inventory.filter(item => item.id !== id);
        
        saveData();
        renderAll();
        closeModal(selectors.sellItemModal);
    });

    // Event Listeners - Ações dos itens vendidos
    selectors.soldTableBody.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        
        if (e.target.classList.contains('delete-sale-btn')) {
            if (confirm('Tem certeza?')) {
                soldItems = soldItems.filter(item => item.id !== id);
                saveData();
                renderAll();
            }
        }

        if (e.target.classList.contains('edit-sale-btn')) {
            const item = soldItems.find(i => i.id === id);
            document.getElementById('edit-sale-id').value = item.id;
            document.getElementById('edit-sell-price').value = item.sellPrice;
            document.getElementById('edit-sell-channel').value = item.sellChannel;
            document.getElementById('edit-sell-date').value = item.sellDate;
            openModal(selectors.editSaleModal);
        }
    });

    // Event Listeners - Editar venda
    selectors.editSaleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = parseInt(document.getElementById('edit-sale-id').value);
        const index = soldItems.findIndex(i => i.id === id);
        if (index === -1) return;

        soldItems[index] = {
            ...soldItems[index],
            sellPrice: parseFloat(document.getElementById('edit-sell-price').value),
            sellChannel: document.getElementById('edit-sell-channel').value,
            sellDate: document.getElementById('edit-sell-date').value
        };

        saveData();
        renderAll();
        closeModal(selectors.editSaleModal);
    });

    // Event Listeners - Backup e restauração
    selectors.exportBtn.addEventListener('click', () => {
        if (inventory.length === 0 && soldItems.length === 0) {
            alert('Não há dados para exportar.');
            return;
        }

        const backupObject = {
            inventory: inventory,
            soldItems: soldItems
        };

        const jsonString = JSON.stringify(backupObject, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        
        link.href = url;
        link.download = `backup_gestor_${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('Backup gerado com sucesso!');
    });

    selectors.importBtn.addEventListener('click', () => {
        selectors.importFileInput.click();
    });

    selectors.importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.hasOwnProperty('inventory') || !data.hasOwnProperty('soldItems')) {
                    throw new Error('Arquivo de backup inválido.');
                }

                if (confirm('ATENÇÃO!\n\nIsso substituirá TODOS os dados atuais.\n\nDeseja continuar?')) {
                    inventory = data.inventory || [];
                    soldItems = data.soldItems || [];
                    saveData();
                    renderAll();
                    alert('Backup restaurado com sucesso!');
                }
            } catch (error) {
                alert('Erro ao importar o arquivo: ' + error.message);
            } finally {
                selectors.importFileInput.value = '';
            }
        };
        reader.readAsText(file);
    });
    
    // Event Listeners - Filtros do dashboard
    selectors.yearFilter.addEventListener('change', renderAll);
    selectors.monthFilter.addEventListener('change', renderAll);
    
    // Inicialização da aplicação
    loadData();
    populateDateFilters();
    renderAll();
    fetchDollarRate();
});