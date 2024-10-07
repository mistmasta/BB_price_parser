// ==UserScript==
// @name         Данные о товарах Dota2
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Получение данных о товарах с карточек
// @author       mistmasta
// @match        https://betboompass.com/shop?order=DESC&is_meta=false&type_game=dota2
// @downloadURL  https://github.com/mistmasta/BB_price_parser/raw/main/main.js
// @updateURL    https://github.com/mistmasta/BB_price_parser/raw/main/main.js
// @homepage     https://github.com/mistmasta/BB_price_parser/
// @grant        GM.xmlHttpRequest
// @connect      steamcommunity.com
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

// Функция для получения цены товара
const getPrice = (itemTitle) => {
    return new Promise((resolve) => {
        const url = `https://steamcommunity.com/market/priceoverview/?currency=5&country=ru&appid=570&market_hash_name=${encodeURIComponent(itemTitle)}&format=json`;

        GM.xmlHttpRequest({
            method: "GET",
            url: url,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.success) {
                        resolve({ title: itemTitle, lowest_price: data.lowest_price });
                    } else {
                        resolve({ title: itemTitle, lowest_price: null });
                    }
                } catch (e) {
                    resolve({ title: itemTitle, lowest_price: null });
                }
            },
            onerror: function(err) {
                resolve({ title: itemTitle, lowest_price: null });
            }
        });
    });
};

// Функция для обработки карточек с задержкой
const processCards = async (cards) => {
    for (const card of cards) {
        const titleElement = card.querySelector('.ProductCard__ProductCardTitle-sc-1upqa8g-7');

        if (titleElement) {
            const itemTitle = titleElement.textContent.trim();
            const priceData = await getPrice(itemTitle);

            if (priceData.lowest_price) {
                const priceContainer = card.querySelector('.ProductCard__CurrencyWidgetLabelContainer-sc-1upqa8g-8');

                if (priceContainer) {
                    const newPriceElement = document.createElement('div');
                    // Форматируем lowest_price с запятой
                    const formattedLowestPrice = parseFloat(priceData.lowest_price).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    newPriceElement.textContent = `Цена: ${formattedLowestPrice} руб. `;
                    newPriceElement.style.fontWeight = 'bold';

                    // Извлечение стоимости из span элемента
                    const priceSpan = card.querySelector('.CurrencyWidget__CurrencyWidgetValue-sc-1800lge-1.hqVOoH');
                    if (priceSpan) {
                        // Используем innerHTML и заменяем сущности, чтобы избежать HTML проблем
                        const extractedPrice = priceSpan.innerHTML.trim()
                            .replace(/&nbsp;/g, '')  // Убираем неразрывные пробелы
                            .replace(/,/g, '.')       // Заменяем запятую на точку
                            .replace(/s+/g, '');     // Удаляем все пробелы

                        // Преобразуем в число
                        const numericPrice = parseFloat(extractedPrice);
                        // Приведение priceData.lowest_price к числовому формату
                        const lowestPrice = parseFloat(priceData.lowest_price);

                        // Проверяем, что numericPrice и lowestPrice больше 0 перед делением
                        if (numericPrice > 0 && lowestPrice > 0) {
                            // Делим lowestPrice на numericPrice
                            const divisionResult = lowestPrice / numericPrice;

                            // Добавляем divisionResult к newPriceElement с точностью до 4 знаков после запятой
                            const formattedDivisionResult = divisionResult.toFixed(4);
                            newPriceElement.textContent += `(${formattedDivisionResult})`; // Добавляем результат деления в элемент

                            // Вставляем newPriceElement в DOM
                            priceContainer.parentNode.insertBefore(newPriceElement, priceContainer);

                            // Задержка в 10 секунд между запросами
                            await new Promise(resolve => setTimeout(resolve, 10000));
                        }
                    }
                }
            }
        }
    }
};

    const observer = new MutationObserver(() => {
        const cards = document.querySelectorAll('.ProductCard__ProductCardContainer-sc-1upqa8g-0');
        if (cards.length > 0) {
            observer.disconnect(); // Отключаем себя, так как карточки загружены
            processCards(cards); // Обрабатываем карточки
        }
    });

    // Начинаем наблюдение за изменениями в DOM
    observer.observe(document.body, { childList: true, subtree: true });
})();
