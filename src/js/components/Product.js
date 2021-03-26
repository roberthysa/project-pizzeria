import {select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product{
  constructor(id, data){
    const thisProduct = this;

    thisProduct.id = id;
    thisProduct.data = data;

    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();

    // console.log('new Product:', thisProduct);
  }

  renderInMenu(){
    const thisProduct = this;

    /* generate HTML based on template */
    const generatedHTML = templates.menuProduct(thisProduct.data);
    /* console.log('generatedHTML:', generatedHTML); */

    /* create element using utils.createElementFromHTML */
    thisProduct.dom = {};
    thisProduct.dom.element = utils.createDOMFromHTML(generatedHTML);

    /* find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);

    /* add element to menu */
    menuContainer.appendChild(thisProduct.dom.element);
  }

  initAccordion(){
    const thisProduct = this;

    /* START: add event listener to clickable trigger on event click */
    thisProduct.dom.accordionTrigger.addEventListener('click', function(event) {

      /* prevent default action for event */
      event.preventDefault();

      thisProduct.dom.element.classList.toggle('active');

      /* find active product (product that has active class) */
      const activeProducts = document.querySelectorAll(select.all.menuProductsActive);

      for (let activeProduct of activeProducts) {

        /* if there is active product and it's not thisProduct.element, remove class active from it */
        if (activeProduct !== thisProduct.dom.element){

          /* toggle active class on thisProduct.element */
          activeProduct.classList.remove('active');
        }
      }
    });
  }

  initOrderForm(){
    const thisProduct = this;
    // console.log('initOrderForm');

    thisProduct.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });

    for(let input of thisProduct.dom.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }

    thisProduct.dom.cartButton.addEventListener('click', function(event){
      event.preventDefault();

      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

  processOrder(){
    const thisProduct = this;
    // console.log('processOrder');

    // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.dom.form);
    // console.log('formData:', formData);

    // set price to default price
    let price = thisProduct.data.price;

    // for every category (param)...
    for(let paramId in thisProduct.data.params) {
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];
      // console.log('paramId:', paramId, 'param:', param);

      // for every option in this category
      for(let optionId in param.options) {
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionId];
        // console.log('optionId:', optionId, 'option:', option);

        // finding a image with class .paramId-optionId in the image div
        const imgClass = '.' + paramId + '-' + optionId;
        const optionImage = thisProduct.dom.imageWrapper.querySelector(imgClass);
        // console.log('optionImage:', optionImage);
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

        // check if there is param with a name of paramId in formData and if it includes optionId
        if(optionSelected) {
          // check if the option is not default
          if(!option.default) {
            // add option price to price variable
            price = price + option.price;
          }
          // if image exsist - add class 'active' to image
          if(optionImage) {
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          }
        } else {
          // check if the option is default
          if(option.default) {
            // reduce price variable
            price = price - option.price;
          }
          // if image exsist - remove class 'active' from image
          if(optionImage) {
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
        // console.log('current price:', price);
      }
    }

    /* single price of the ordered product */
    thisProduct.priceSingle = price;

    /* multiply price by amount */
    price *= thisProduct.amountWidget.value;

    // update calculated price in the HTML
    thisProduct.dom.priceElem.innerHTML = price;
  }

  initAmountWidget(){
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);

    thisProduct.dom.amountWidgetElem.addEventListener('updated', function(){
      thisProduct.processOrder();
    });
  }

  addToCart(){
    const thisProduct = this;

    // app.cart.add(thisProduct.prepareCartProduct());

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    });

    thisProduct.element.dispatchEvent(event);
  }

  prepareCartProduct(){
    const thisProduct = this;

    const productSummary = {};

    productSummary.id = thisProduct.id;
    productSummary.name = thisProduct.data.name;
    productSummary.amount = thisProduct.amountWidget.value;
    productSummary.priceSingle = thisProduct.priceSingle;
    productSummary.price = thisProduct.priceSingle * thisProduct.amountWidget.value;
    productSummary.params = thisProduct.prepareCartProductParams();

    return productSummary;
  }

  prepareCartProductParams(){
    const thisProduct = this;

    // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.dom.form);
    // console.log('formData:', formData);

    // make new object params
    const params = {};

    // for every category (param)...
    for(let paramId in thisProduct.data.params) {
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];

      // create category param in params const eg. params = { ingredients: { label: 'Ingredients', options: {}}}
      params[paramId] = {
        label: param.label,
        options: {},
      };

      // for every option in this category
      for(let optionId in param.options) {
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionId];
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

        // if the option is selected
        if(optionSelected) {
          // collect selected params in object params
          params[paramId]['options'][optionId] = option.label;
        }
      }
    }

    return params;
  }

  getElements(){
    const thisProduct = this;

    thisProduct.dom.accordionTrigger = thisProduct.dom.element.querySelector(select.menuProduct.clickable);
    thisProduct.dom.form = thisProduct.dom.element.querySelector(select.menuProduct.form);
    thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
    thisProduct.dom.cartButton = thisProduct.dom.element.querySelector(select.menuProduct.cartButton);
    thisProduct.dom.priceElem = thisProduct.dom.element.querySelector(select.menuProduct.priceElem);
    thisProduct.dom.imageWrapper = thisProduct.dom.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.dom.amountWidgetElem = thisProduct.dom.element.querySelector(select.menuProduct.amountWidget);
  }
}

export default Product;
