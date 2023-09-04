const BaseView = $.Class.create({
    api: axios.create({
        baseURL: "/api/1.0/public"
    }),
    storage: window.localStorage,
    init: function(){
        log("Init BaseView");
        this.renderFront();
        this.cart();
        this.carousel();
        this.addProduct();
        this.formSearch();
        this.bind_events();
        this.fixedHeader();
        this.horizontalScroll();
        this.cookieLGPD();
        this.maskForm();
        this.seals();
    },
    seals: function(){
        $(".item-product .seal-subscription").each(function(){
            $(this).closest(".item-product .seals").find(".seal-subscription").hide();
            $(this).closest(".item-product").find(".seals").append(`<span class="seal seal-assinatura bg-info text-light font-weight-bold py-1 px-2 rounded">Desconto na assinatura</span>`);
        });
        
        $(".item-product .seal-desconto-progressivo").each(function(){
            if($(this).closest(".item-product").find(".box-seal-desconto-progressivo").length || !$(this).closest(".item-product").find(".sale-price").length) return;
            const price = fromCurrencyToFloat($(this).closest(".item-product").find(".sale-price").text());
            const value = roundToTwo(price - (price * $(this).attr("percentage"))).toCurrency();
            const quantity = $(this).attr("qtd");
            const $box = $(`<div class="box-seal-desconto-progressivo text-center mt-2 p-2"><p>Leve ${quantity} pague <span>${value}</span> cada</p></div>`);
            $(this).closest(".item-product").find(".prices").append($box);
            //$(this).closest(".list-products .item-product").find(".seals").append(`<span class="seal desconto-progressivo py-1 px-2">Leve mais<span> Por menos</span></span>`);
        });  
    },
    cookieLGPD: function(){
        if(!Cookies.get("accept_cookie")){
           $("body").append(`<div class="accept_cookie">
                <div class="d-flex flex-column align-items-center">
					<i class="icon-cookie h1 m-0 text-primary"></i>
                    <p class="text-center py-2">Utilizamos cookies para garantir que você tenha uma melhor experiência em nosso site. Ao continuar navegando você concorda com a nossa <a href="/politica-de-privacidade/s" class="text-underline">política de privacidade</a></p>
                    <button class="btn btn-checkout close_accept_cookie">Aceitar e fechar</button>
                </div>
           </div>`);
           $(".close_accept_cookie").unbind("click.convertize").bind("click.convertize", function(e){
               e.preventDefault();
               $(this).closest(".accept_cookie").remove();
               Cookies.set("accept_cookie", true, {expires: 30, path: "/"});
           });
        };
    },
    fixedHeader: function(){
        if($("body").hasClass("is_mobile")) return;
        $(window).scroll(function(){
            const scroll = $(window).scrollTop();
            if(scroll >= 250){
                if(!$("body").hasClass("fixed")){
                    $("#main-wrapper").css("paddingTop", `${$("#main-wrapper > .header").height()}px`);
                    $("body").addClass("fixed");
                }
            }else{
                $("body").removeClass("fixed");
                $("#main-wrapper").removeAttr("style");
            }
        }).trigger("scroll");
    },
    baseFunctions: function(){
        $(".img-lazy:not(.loaded)").show().lazyload({
            data_attribute:"src",
            effect: "show"
        });
        $("input[name=quantity]:not([type=hidden])").spinner({
            min: 1
        });
    },
    bind_events: function(){
        const self = this;
        this.baseFunctions();

        $(".newsletter form").formValidation({
            success: (form, response) => {
                if(response.status == 200 && response.data){
                    const html = $(response.data).find("form").html();
                    form.html(html);
                }
            },
            error: (form, error) => {
                // log(error)
            }
        });
        
        $("body").off("click.convertize2", ".bt_login, .btn-login");
        $("body").on("click.convertize2", ".bt_login, .btn-login", function(e){
            setTimeout(function(){
                $("#boxLogin .initial-page .modal-body").append(`<div class="mt-4"><a href="/cadastro-cliente/s" class="btn btn-block btn-outline-dark py-3"><i class="icon-user h4 align-middle mr-2"></i> Realize seu cadastro</a></div>`);
            }, 1);
        });

        $("body").off("click.convertize", ".bt-open-page");
        $("body").on("click.convertize", ".bt-open-page", function(e){
            e.preventDefault();
            const target = $(this).data("target");

            if(target == "#mini-cart" && $(target).hasClass("loading")){
                self.loadCart();
            }else if(target == "#floating-menu" && $("#menuMobile").is(":empty")){
                $("#menuMobile").html(menuMobileTemplate)
            }else if(target == "#floating-sidebar"){
                const sidebarHTML = $("#main-wrapper .sidebar").clone();
                $("#floating-sidebar .content-page").html(sidebarHTML);
            };

            $("html,body").addClass("open-page");
            $(".floating-page").removeClass("active");
            $(target).addClass("active");
            setTimeout(function(){
                if($(target).find(".autofocus").length){
                    const val = $(target).find(".autofocus").val();
                    $(target).find(".autofocus").val("").val(val).focus();
                };
            }, 100);
        });

        $("body").off("click.convertize", ".mask-floating-page, .floating-page .close");
        $("body").on("click.convertize", ".mask-floating-page, .floating-page .close", function(e){
            e.preventDefault();
            $("html,body").removeClass("open-page");
            $(".floating-page").removeClass("active");
        });

        $(".countdown").each(function(){
            const finalDate = $(this).data("datetime");
            $(this).countdown(finalDate, function(event){
                $(this).html(`<div class="d-flex justify-content-around">
                    <div class="day">
                        ${event.strftime("%D")}
                    </div>
                    <div class="hour">
                        ${event.strftime("%H")}
                    </div>
                    <div class="minute">
                        ${event.strftime("%M")}
                    </div>
                    <div class="second">
                        ${event.strftime("%S")}
                    </div>
                </div>`);
            });
        });

        $("body").off("click.convertize", "#nav-inside .content-nav-inside a");
        $("body").on("click.convertize", "#nav-inside .content-nav-inside a", self.mobileNavbar);

        $("body").off("click.convertize", ".bt-menu-navbar");
        $("body").on("click.convertize", ".bt-menu-navbar", function(e){
            e.preventDefault();
            $(this).addClass("active");
            $("#menuDepartament").addClass("active");
        });
        $("body").off("click.convertize", "#menuDepartament .mask");
        $("body").on("click.convertize", "#menuDepartament .mask", function(e){
            e.preventDefault();
            $("#menuDepartament, .bt-menu-navbar").removeClass("active");
        });

        $("body").off("click.convertize", ".scrollTop");
        $("body").on("click.convertize", ".scrollTop", function(e){
            e.preventDefault();
            const target = $($(this).attr("href"));
            if(target.length && window.scrollTo){
                window.scrollTo({
                    top: target.offset().top -130,
                    behavior: "smooth"
                });
            }
        });

        $("body").off("click.convertize", ".accessibility-font button");
        $("body").on("click.convertize", ".accessibility-font button", function(e){
            e.preventDefault();
            const action = $(this).data("action");
            const max = 28;
            const min = 14;
            const $box = $(this).closest("div[class*=font-size]");
            let actual = parseInt($box.attr("class").replace(/\D/g, ""));

            if(action == "plus") actual += 2;
            else if(action == "minus") actual -= 2;

            if(actual > max) actual = 28;
            if(actual < min) actual = min;

            $box.attr("class", `font-size-${actual}`);
        });

        // Close elements by ESC
        $(document).keyup(function(e){
            if(e.key === "Escape"){
                if($("#menuDepartament, .bt-menu-navbar").hasClass("active")) $("#menuDepartament, .bt-menu-navbar").removeClass("active");
                if($("html,body").hasClass("open-page")){
                    $("html,body").removeClass("open-page");
                    $(".floating-page").removeClass("active");
                };
                if($(".autocomplete").removeClass("hasClass")){
                    $(".autocomplete").parent().find("input[type=text]").blur();
                    $(".autocomplete").removeClass("active");
                }
                $(".modal").modal("hide");
            }
        });
    },
    formSearch: function(){
        const self = this;
        
        // GA 4
        $(".form-search form").on("submit.convertize", function(){
            $(this).find("input[name=q]").val($(this).find("input[name=q]").val().toLowerCase());
            if(window.cvz) window.cvz.events.trigger("search", {term: $(this).find("input[name=q]").val().toLowerCase()});
        });
        // GA 4 - end
        
        $("body").off("focus.convertize", ".form-search.desktop input");
        $("body").on("focus.convertize", ".form-search.desktop input", function(e){
            e.preventDefault();
            if($(".autocomplete .popular-words").html() || $(".autocomplete .last-search").html()){
                $(this).addClass("focus");
                $(this).parent().find(".autocomplete").addClass("active");
            }
        });

        $("body").off("click.convertize", ".form-search .close");
        $("body").on("click.convertize", ".form-search .close", function(e){
            e.preventDefault();
            $(this).closest(".form-search").find(".form-control").removeClass("focus");
            $(this).closest(".form-search").find(".autocomplete").removeClass("active");
        });

        $("body").off("keyup.convertize", ".form-search input");
        $("body").on("keyup.convertize", ".form-search input", function(e){
            e.preventDefault();
            $(this).parent().find(".autocomplete").addClass("active");
            const $form = $(this).closest("#floating-search").length ? $(this).closest("#floating-search"):$(this).closest(".form-search");
            if($(this).val()){
                $form.find(".not-results").hide();
                $form.find(".results").show();
            }else{
                $form.find(".not-results").show();
                $form.find(".results").hide();
            };
        });

        if(typeof menuPopularWordsTemplate !== "undefined"){
            if(menuPopularWordsTemplate){
                $(".section-words").removeClass("d-none");
                $(".popular-words").html(menuPopularWordsTemplate);
            };
        };

        let search_status;

        $(".form-search input").autocomplete({
            source: async function(request){
                $("#floating-search, .form-search .autocomplete").find(".results").html(`<small>Carregando...</small>`).addClass("loading");
                const response = await axios.get(`${window.__url_path__}busca/suggest/?query_term=${request.term}`);
                search_status = response.status;
                if(response.status == 200 && response.data && response.data.result_list){
                    const listItems = [`<div><form></form></div>`];
                    const categories = [];
                    response.data.result_list.map(function(item){
                        if(item.type === "category"){
                            const name = item.name.split("/").pop().replaceAll("---","/").replaceAll("-"," ");
                            categories.push(`<p class="mb-1"><a href="${request.term}"><b>${request.term}</b> em <span class="text-capitalize">${name}</span></a></p>`);
                        }
                        if(item.type === "sku"){
                            listItems.push(`<div class="item-product" data-id=sku_${item.id}>
                                <a href="/${item.url}/p" class="item-image">
                                    <span class="item-image mr-2"><img src="${window.__media_prefix__}${item.image ? item.image.replace("/small/", "/mini/"):"img/blank.png"}" width="65" height="65" alt="" /></span>
                                </a>
                                <div class="desc position-relative w-100 align-items-center">
                                    <div class="w-100">
                                        <h2 class="title">
                                            <a href="/${item.url}/p">
                                                ${item.name}
                                            </a>
                                        </h2>
                                        <div class="box-prices">
                                            <div class="prices">
                                                <div class="d-flex align-items-center">
                                                    ${item.unit_price < item.price ? `<p class="unit-price mr-3"><span>${item.unit_price.toCurrency()}</span></p>`:""}
                                                    <p class="sale-price"><strong>${item.price.toCurrency()}</strong></p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <form method="POST" action="/${item.url}/p" class="product-form w-auto">
                                        <div style="display:none">
                                            <input type="hidden" value="${item.product_id }" name="product" />
                                            <input type="hidden" value="${item.price }" name="price" />
                                        </div>
                                        <div class="purchase">
                                            <label aria-label="Quantidade" class="m-0 mr-2">
                                                <input type="tel" value="1" name="quantity" />
                                            </label>
                                            <button type="button" class="btn btn-checkout mt-0" aria-label="Comprar">Comprar</button>
                                        </div>
                                    </form>
                                </div>
                            </div>`);
                        }
                    })
                    $("#floating-search, .form-search .autocomplete").find(".results").html((categories.length > 0 ? `<div class="categories"><h4 class="h6">Sugestões de pesquisa</h4>${categories.join("")}</div><hr class="w-100 mt-2 mb-3" />`:"") + listItems.join("")).removeClass("loading");
                    self.functionsCart();
                    self.renderFront();
                }
            },
            minLength: 2,
            select: function(event, ui){
                log( "Selected: " + ui.item.value + " aka " + ui.item.id );
            }
        });

        $("body").off("submit.convertize", ".form-search form")
        $("body").on("submit.convertize", ".form-search form", function(e){
            const value = $(this).find("input[name=q]").val();
            const words = JSON.parse(self.storage.getItem("cvz_last_search") || "[]");
            words.unshift(window.DOMPurify.sanitize(value));
            if(search_status == 200) self.storage.setItem("cvz_last_search", JSON.stringify(words.filter((v, i, a) => a.indexOf(v) === i)))
        });

        $(document).on("click", function(e){
            if(!$(e.target).closest(".form-search").length){
                $(".autocomplete.active").removeClass("active");
                $(".form-search .form-control.focus").removeClass("focus");
            }
        });

        const words = JSON.parse(self.storage.getItem("cvz_last_search") || "[]");

        if(words.length){
            $("#floating-search, .form-search .autocomplete").find(".not-results").prepend(`
                <p class="h6">Últimas pesquisas</p>
                <ul class="last-search mb-3"></ul>
            `);
            words.slice(0,6).map(function(w){
				const purifyw = window.DOMPurify.sanitize(w); 
                $("#floating-search, .form-search .autocomplete").find("ul.last-search").append(`<li>
                    <a href="#" data-word="${purifyw}">
                        <i class="icon-history mr-2"></i>
                        ${purifyw}
                    </a>
                    <i class="icon-trash remove" data-word="${purifyw}"></i>
                </li>`);
            });
            $("#floating-search, .form-search .autocomplete").find("ul.last-search a").on("click.convertize", function(e){
                e.preventDefault();
                const $form = $(this).closest("#floating-search").length ? $(this).closest("#floating-search"):$(this).closest(".form-search");
                $form.find("input[name=q]").val($(this).data("word"));
                $form.find("form").trigger("submit.convertize");
            });
            $("#floating-search, .form-search .autocomplete").find("ul.last-search .remove").on("click.convertize", function(e){
                const word = $(this).data("word");
                const words = JSON.parse(self.storage.getItem("cvz_last_search") || "[]");
                self.storage.setItem("cvz_last_search", JSON.stringify(words.filter((v) => v != word)))
                $(this).closest("li").remove();
            });
        }
    },
    addProduct: function(){
        const self = this;

        $("body").off("change.convertize", ".product-form .variations input[type=radio], .product-form .variations select");
        $("body").on("change.convertize", ".product-form .variations input[type=radio], .product-form .variations select", async function(e){
            e.preventDefault();
            const $boxProduct = $(this).closest(".product-detail, .item-product");
            const $form = $(this).closest(".product-form");
            const list_values = $form.find(".form-group input[type=radio]:checked, .form-group select").map(function(){
                return `option=${$(this).val()}`
            });
            const url = `/products/${$form.find("input[name=slug]").val()}/skus/?${[...list_values].join("&")}`;

            try{
                const response = await self.api.get(url);
                const resp = response.data;
                let sku;
                if(resp.count===1){
                    sku = resp.results[0];
                }else if(resp.count && $form.find("input[name=default]").val()){
                    sku = resp.results.find(function(item){
                        return item.id === parseInt($form.find("input[name=default]").val());
                    })
                }
                if(sku){
                    const price = parseFloat(sku.sale_price || sku.unit_price);

                    const discountPix = $boxProduct.find(".sale-price").data("discount");
                    if(discountPix){
                        const pricePix = price - (price * (discountPix/100))
                        $boxProduct.find(".sale-price strong").html(pricePix.toCurrency());
                    }else{
                        $boxProduct.find(".sale-price strong").html(price.toCurrency());
                    };
                    $boxProduct.find(".spot-price strong").html(sku.get_price_boleto.toCurrency());
                    $boxProduct.find(".get_min_installments").html(`${parseInt(price / parseFloat(sku.get_card_price))}x`);
                    $boxProduct.find(".get_card_price").html(parseFloat(sku.get_card_price).toCurrency());
                    if(sku.sale_price){
                        $boxProduct.find(".unit-price").removeClass("hide").show().find("span").html(parseFloat(sku.unit_price).toCurrency());
                        const discount =+ (Math.round(((parseFloat(sku.sale_price) * 100) / parseFloat(sku.unit_price) - 100)*-1 + "e+2") + "e-2");
                        $boxProduct.find(".discount").removeClass("d-none").addClass("d-inline-block").html(`${parseInt(discount)}%`);
                    }else{
                        $boxProduct.find(".unit-price").addClass("hide").hide().find("span").html("");
                        $boxProduct.find(".discount").removeClass("d-inline-block").addClass("d-none").find("span").html
                    }

                    if(sku.has_stock){
                        $boxProduct.find(".show-available").show();
                        $boxProduct.find(".hide-available").hide();
                    }else{
                        $boxProduct.find(".show-available").hide();
                        $boxProduct.find(".hide-available").show();
                    }

                    $boxProduct.attr("data-id", `sku_${sku.id}`);

                    if(window.dataProduct && window.dataProduct.sku) window.dataProduct.sku = sku.id;

                    if(self.updateImages) self.updateImages(sku, $boxProduct);
                }
            }catch(err){

            }

        });

        $("body").off("click.convertize", ".item-product:not(.added) .product-form .btn-checkout:not(.not-action)");
        $("body").on("click.convertize", ".item-product:not(.added) .product-form .btn-checkout:not(.not-action)", function(e){
            e.preventDefault();

            const $bt = $(this);
            const $form = $(this).closest(".product-form");

            $form.addClass("loading");
            $bt.addClass("loading").prop("disabled", true);

            if($form.data("validator")){
                $form.submit();
                return true;
            };

            const data_rules = {};
            const data_messages = {};

            $form.find(".form-group.required select, .form-group.required input[type=radio]").each(function(){
                const name = $(this).attr("name");
                data_rules[name] = {
                    required: true
                };
                data_messages[name] = {
                    required: $(this).data("title") ? `Selecione a opção de <b>${$(this).data("title")}</b>`:"Selecione uma opção"
                };
            });

            $form.validate({
                rules: data_rules,
                messages: data_messages,
                errorElement: "p",
                errorPlacement: function(error, element){
                    element.closest(".variations").addClass("error");
                    const ul = $(`<div class="errorlist" />`).html(error.addClass("text-danger mb-1"));
                    if(!error.html()) return;
                    element.closest(".form-group").prepend(ul);            
                },
                invalidHandler: function(event, validator){
                    $form.removeClass("loading");
                    $bt.removeClass("loading").prop("disabled", false);
                },
                submitHandler: async function(form, event){
                    event.preventDefault();

                    const body = {
                        options: []
                    }
                    $(form).serializeArray().map(function(item){
                        if(item.name.indexOf("option_") >= 0){
                            body.options.push(item.value);
                        }else{
                            body[item.name] = item.value;
                        };
                    });
                    body.quantity = parseInt(body.quantity || "1");

                    try{
                        const response = await self.api.post("/order/", {
                            products: [body]
                        });
                        const resp = response.data;
                        self.renderCart(resp);
                        if(window.events && window.events.loadCart) window.events.loadCart();

                        $(`.my-cart [data-toggle="popover"]`).popover("show");
                        setTimeout(function(){
                            $bt.removeClass("added");
                            $(`.my-cart [data-toggle="popover"]`).popover("hide");
                        }, 3000);

                        $("#mini-cart").addClass("active").removeClass("loading");

                    }catch(err){
                        if(err.response && err.response.data && err.response.data.messages){
                            err.response.data.messages.map(function(message){
                                $.toast({
                                    hideAfter: 7000,
                                    icon: message.level.toLowerCase(),
                                    text: message.message,
                                    position: "bottom-center",
                                    showHideTransition: "plain",
                                    beforeShow: function(){
                                        $(".jq-toast-loader").addClass("jq-toast-loaded")
                                    }
                                });
                            });
                        };
                    }

                    $form.removeClass("loading");
                    $bt.removeClass("loading").prop("disabled", false);

                    return false;
                }
            });
            $form.trigger("submit.validate");
        });

        $("body").off("click.convertize", ".product-form .btn-wishlist");
        $("body").on("click.convertize", ".product-form .btn-wishlist", function(e){
            e.preventDefault();
            const $bt = $(this);
            const $form = $(this).closest(".product-form");

            const body = new FormData();

            $form.serializeArray().map(function(item){
                if(item.value) body.append(item.name, item.value);
            });

            body.append("add_wishlist", true);

            $bt.addClass("loading").prop("disabled", true);

            axios({
                url: $form.attr("action"),
                method: "POST",
                data: body,
                headers: {
                    "Content-Type": "application/json",
                    "x-requested-with": "XMLHttpRequest"
                }
            })
            .then(function(response){
                const resp = response.data;
                if(resp && resp.messages){
                    resp.messages.map(function(message){
                        $.toast({
                            hideAfter: 7000,
                            icon: message.level.toLowerCase(),
                            text: message.message,
                            position: "top-center",
                            showHideTransition: "plain",
                            beforeShow: function(){
                                $(".jq-toast-loader").addClass("jq-toast-loaded")
                            }
                        });
                    });
                    $bt.addClass("active");
                }else if(resp && resp.error){
                    $.toast({
                        hideAfter: 7000,
                        icon: "error",
                        text: resp.error,
                        position: "top-center",
                        showHideTransition: "plain",
                        beforeShow: function(){
                            $(".jq-toast-loader").addClass("jq-toast-loaded")
                        }
                    });
                }
                $bt.removeClass("loading").prop("disabled", false);
            })
            .catch(function(error){
                log(error);
                $bt.removeClass("loading").prop("disabled", false);
            });
        });

    },
    cart: function(){
        const self = this;
        $("body").off("blur.convertize", "#mini-cart input[name=quantity], .item-product.added input[name=quantity]");
        $("body").on("blur.convertize", "#mini-cart input[name=quantity], .item-product.added input[name=quantity]", async function(e){
            e.preventDefault();
            const $this = $(this);
            const uuid = Cookies.get("convertize_cart_id");
            const url = `/order/${uuid}/${$(this).closest("form, li").find("input[name=_id]").val()}/`;

            $(this).closest("form, li").addClass("loading");

            try{
                const response = await self.api.put(url, {
                    quantity: parseInt($this.val()) <= 0 ? 1:parseInt($this.val())
                });
                const resp = response.data;
                self.renderCart(resp);
            }catch(err){
                log(err)
            };

            $(this).closest("form,li").removeClass("loading");
        });

        $("body").off("click.convertize", "#mini-cart .remove-item, .item-product.added .product-form .btn-checkout:not(.not-action)");
        $("body").on("click.convertize", "#mini-cart .remove-item, .item-product.added .product-form .btn-checkout:not(.not-action)", async function(e){
            e.preventDefault();
            const uuid = Cookies.get("convertize_cart_id");
            const url = `/order/${uuid}/${$(this).closest("form,li").find("input[name=_id]").val()}/`;

            $(this).closest("form,li").addClass("loading");

            try{
                const response = await self.api.delete(url);
                const resp = response.data;
                self.renderCart(resp);
            }catch(err){
                log("errr")
                log(err)
            };

            $(this).closest("form,li").removeClass("loading");

        });

        $("body").off("click.convertize", "#mini-cart .codes a");
        $("body").on("click.convertize", "#mini-cart .codes a", async function(e){
            e.preventDefault();
            const $this = $(this);
            const uuid = Cookies.get("convertize_cart_id");
            const url = `/order/${uuid}/coupons/`;

            $(this).addClass("loading");

            try{
                const response = await self.api.delete(url, {
                    data:{
                        code: $this.text()
                    }
                });
                const resp = response.data;
                self.renderCart(resp);
            }catch(err){
                log(err)
            };

            $(this).removeClass("loading");
        });

        this.functionsCart();
    },
    functionsCart: function(){
        const self = this;
        let interval = false;
        $("#mini-cart .content-cart input[name=quantity], .item-product .product-form input[name=quantity]").spinner({
            min: 1,
            classes: {
                "ui-spinner": "ui-corner-all",
                "ui-spinner-down": "icon-minus",
                "ui-spinner-up": "icon-plus"
            },
            spin: function(event, ui){
                if(interval){
                    clearTimeout(interval);
                    interval = false;
                };
                interval = setTimeout(function(){
                    var value = $(event.target).val()
                    interval = true
                    $(event.target).blur();
                }, 250);
            }
        }).on("keyup keypress", function(e){
            const keyCode = e.keyCode || e.which;
            if(keyCode === 13){ 
                e.preventDefault();
                $(event.target).blur();
                return false;
            }
        });
        $("#mini-cart .coupon").validate({
            rules: {
                coupon: {
                    required: true,
                }
            },
            messages: {
                coupon: {
                    required: ""
                }
            },
            errorElement: "p",
            errorPlacement: function(error, element){
                element.closest(".variations").addClass("error");
                var ul = $('<div class="errorlist" />').html(error);
                if(!error.html()) return;
                element.closest('.variations').append(ul);
            },
            submitHandler: async function(form, event){
                event.preventDefault();
                const uuid = Cookies.get("convertize_cart_id");
                const url = `/order/${uuid}/coupons/`;

                $(form).find("button").button("loading");

                try{
                    const response = await self.api.post(url, {
                        code: $(form).find("[name=coupon]").val()
                    });
                    const resp = response.data;
                    self.renderCart(resp);
                }catch(err){
                    log(err)
                };

                $(form).find('button').button("reset");
            }
        });
    },
    loadCart: async function(){
        const self = this;
        const uuid = Cookies.get("convertize_cart_id");
        if(!uuid){
            $("#mini-cart").removeClass("loading");
            return;
        }
        $("#mini-cart .content-cart ul").html("");
        try{
            const response = await self.api.get(`/order/${uuid}/`);
            const resp = response.data;
            self.renderCart(resp);
        }catch(err){
            log(err);
            if(err.response && err.response.status === 404){
                $("#mini-cart .content-cart ul").html(`<li class="empty">
                    <div class="empty-cart"><span class="face">:(</span><span class="text"><strong>Ops!</strong><br />Você está sem produtos</span></div>
                </li>`);
                Cookies.remove("convertize_cart_id")
            }
            $("#mini-cart").removeClass("loading");
        }
    },
    renderCart: function(data){
        this.storage.setItem("cvz_cart", JSON.stringify(data));

        if(!$("#mini-cart").length) return;
        let total = data.totalizers.total_price;
        let discount = 0;

        if(data.totalizers.shipping_total && data.totalizers.shipping_total != 0) total += data.totalizers.shipping_total;
        if(data.totalizers.discount && data.totalizers.discount != 0) discount -= data.totalizers.discount;
        if(data.totalizers.payment_discount && data.totalizers.payment_discount != 0) discount -= data.totalizers.payment_discount;
        if(data.totalizers.interest && data.totalizers.interest != 0) total += data.totalizers.interest;
        total += discount;
        total = parseFloat(total.toFixed(2));

        $(".request__cart__total_price").html(data.totalizers.total_price.toCurrency());
        $(".request__cart__discount_value").html(discount.toCurrency());
        $(".request__cart__total").html(total.toCurrency());
        $(".request__cart__total_quantity").html(data.items.length);

        $("#mini-cart .content-cart ul").html("");

        data.items.map(function(item){
            let price = "";
            if(item.discount_value < item.total_price){
                price = `<span class="unit-price">${item.total_price.toCurrency()}</span><br /><span class="sale-price">${item.discount_value.toCurrency()}</span>`;
            }else{
                price = `<span class="sale-price">${item.total_price.toCurrency()}</span>`;
            };
            $("#mini-cart .content-cart ul").append(`<li>
                <input type="hidden" value="${item.id}" name="_id" />
                <input type="hidden" value="${item.sku}" name="_sku" />
                ${item.image ?
                    `<a href="${item.url}" class="item-image"><img src="${item.image.replace("/small/", "/mini/")}" width="60" height="60" alt="${item.sku_name}" /></a>`
                :
                    `<a href="${item.url}" class="item-image"><img src="${window.__static_prefix__}img/blank.png" width="60" height="60" alt="${item.sku_name}" /></a>`
                }
                <div class="item-info">
                    <a href="${item.url}" class="item-title d-block">${item.sku_name}</a>
                    <div class="d-flex align-items-center mt-2">
                        <div>
                            <span class="item-price">${price}</span>
                        </div>
				        <div class="quantity ml-4">
                            <input type="tel" value="${item.quantity}" name="quantity" class="input" data-quantity="${item.quantity}" />
                        </div>
                    </div>
                </div>
                <a class="remove-item"><i class="icon-trash"></i></a>
            </li>`);
        });

        $("#mini-cart footer .codes").html("");

        data.coupons.map(function(value){
            $("#mini-cart footer .codes").append(`<a>${value}</a>`);
        });

        if(data.coupons.length > 0) $("#mini-cart footer .codes").addClass("active");
        else $("#mini-cart .footer .codes").removeClass("active");

        if(data.items.length > 0){
            $("#mini-cart footer").show();
        }else{
            $("#mini-cart footer").hide();
            $("#mini-cart .content-cart ul").html(`<li class="empty">
                <div class="empty-cart"><span class="face">:(</span><span class="text"><strong>Ops!</strong><br />Você está sem produtos</span></div>
            </li>`);
        };

        if(data.messages && data.messages.length){
            data.messages.map(function(message){
                $.toast({
                    hideAfter: 7000,
                    icon: message.level.toLowerCase(),
                    text: message.message,
                    position: "top-center",
                    showHideTransition: "plain",
                    beforeShow: function(){
                        $(".jq-toast-loader").addClass("jq-toast-loaded")
                    }
                });
            });
        };

        $("#mini-cart").removeClass("loading");

        this.renderFront();
        this.functionsCart();
    },
    renderFront: function(){
        if(!Cookies.get("convertize_cart_id")) return
        const cart = JSON.parse(this.storage.getItem("cvz_cart"), "{}");
        if(cart && cart.items){
            $(".item-product").removeClass("added").find("input[name=_id]").remove();
            $(".item-product .product-form input[name=quantity]").val(1);
            cart.items.map(item => {
                $(`.item-product[data-id=sku_${item.sku}]`).addClass("added");
                $(`.item-product[data-id=sku_${item.sku}] .product-form`).append(`<input type="hidden" name="_id" value="${item.id}" />`);
                $(`.item-product[data-id=sku_${item.sku}] input[name=quantity]`).val(item.quantity);
            });
        }
    },
    carousel: function(){
        const self = this;
	
        if($(".carousel").length){
            $(".carousel").each(function(){
                const $this = $(this);
                const fixOwl = function(){
                    console.log("onInitialized");
                    var $stage = this.$element.find(".owl-stage"),
                        stageW = $stage.outerWidth(),
                        $el = this.$element.find(".owl-item"),
                        elW = 0;
                    $el.each(function() {
                        elW += $(this).outerWidth() + parseFloat($(this).css("margin-right").slice(0, -2));
                    });
                    if (elW > stageW){
                        $stage.width(stageW);
                        $this.trigger("refresh.owl.carousel");
                    };
                };
                const options = $(this).data("owl-carousel") || {};
                options.lazyLoad = true;
                const $item = $(this);
                try{
                    if(!$(this).hasClass("banner") && !options.hasOwnProperty("responsive")){
                        options["responsive"] = {
                            "1180": {
                                "items": options.hasOwnProperty("items") ? options["items"]:5
                            },
                            "990": {
                                "items": 4
                            },
                            "769": {
                                "items": 3
                            },
                            "0": {
                                "items": 2
                            }
                        };
                    };
                    if(options.hasOwnProperty("startPosition") && options["startPosition"] == "auto") options["startPosition"] = $item.find(".item.active").index();
                    if(options["autoWidth"]) options["onLoadedLazy"] = fixOwl;
                    if(!$(this).hasClass("banner") && !$("body").hasClass("is_mobile")) options["margin"] = 3;
                    $item.owlCarousel(options);
					if(screen.width < 700){
					 	$('.showcase-banners-menores ul').removeClass()
						$('.showcase-banners-menores .item').css('min-width','390px').css('width','390px').css('padding-bottom','10px')
						$('.showcase-banners-menores ul img').css('width','390px')
					}
                }catch(err){
                    console.error(err);
                };
            });
        };
    },
    mobileNavbar: function(e){
        if($(this).next(".sub").length || $(this).hasClass("back")){
            e.preventDefault();
            const _this = $(this);
                _parent = $(this).parent();
            
            let level = parseInt($(this).parent().attr("class").match(/level-[\w-]*\b/).join("").match(/\d+/g).join(""));

            if($(this).hasClass("back")) level -= 1;
            else level += 1;

            $("#nav-inside .content-nav-inside").css({left:($("#nav-inside .content-nav-inside").width()*level)*-1});

            if($(this).next(".sub").length){
                $("#nav-inside .content-nav-inside").find(".sub").removeClass("active");
                _parent.find(".sub").css("top", 0);
                _parent.find(".sub").addClass("active");
                _parent.closest(".sub").addClass("active");
            };

        }
    },
    embedYoutube: function(){
        $(".embed-youtube").each(function(){
            const $this = $(this),
                width = $(this).data("width"),
                height = $(this).data("height"),
                code = $(this).data("code");
            $(this).html(`<div class="cover"><img src="//i2.ytimg.com/vi/${code}/hqdefault.jpg" alt="${$(this).data("title")}" title="${$(this).data("title")}" /></div>`);
            $(this).unbind("click.convertize").bind("click.convertize", function(e){
                e.preventDefault();
                $(this).addClass("played video-container");
                $this.html(`<iframe type="text/html" src="//www.youtube.com/embed/${code}?autoplay=1&rel=0&showinfo=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`);
            });
            if(width) $(this).css("width", width);
            if(height) $(this).css("height", height);
        });
    },
    searchToObject: function(search){
        return search.substring(1).split("&").reduce(function(result, value){
            const parts = value.split('=');
            if(parts[0]) result[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
            return result;
        }, {})
    },
    horizontalScroll: function(){
        if($("body").hasClass("is_mobile")) return;

        $(".horizontal-scroll").each(function(){
            const slider = this;
            const preventClick = (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
            let isDown = false;
            let isDragged = false;
            let startX;
            let scrollLeft;

            slider.addEventListener("mousedown", e => {
                isDown = true;
                slider.classList.add("active");
                startX = e.pageX - slider.offsetLeft;
                scrollLeft = slider.scrollLeft;
            });
            slider.addEventListener("mouseleave", () => {
                isDown = false;
                slider.classList.remove("active");
            });
            slider.addEventListener("mouseup", (e) => {
                isDown = false;
                const elements = document.querySelectorAll("a");
                if(isDragged){
                    for(let i = 0; i<elements.length; i++){
                        elements[i].addEventListener("click", preventClick);
                    }
                }else{
                    for(let i = 0; i<elements.length; i++){
                        elements[i].removeEventListener("click", preventClick);
                    }
                }
                slider.classList.remove("active");
                isDragged =  false;
            });
            slider.addEventListener("mousemove", e => {
                if (!isDown) return;
                isDragged =  true;
                e.preventDefault();
                const x = e.pageX - slider.offsetLeft;
                const walk = (x - startX) * 2;
                slider.scrollLeft = scrollLeft - walk;
            });
        });
    },
    maskForm: function(){
        if($("#checkout").length) return;

        $("input[name=corporate_document]").unmask().mask("00.000.000/0000-00");
        $("input[name=document]").unmask().mask("000.000.000-00");

        const maskBehavior = function(val){
            return val.replace(/\D/g, '').length === 11 ? "(00) 00000-0000" : "(00) 0000-00009";
        },
        options = {onKeyPress: function(val, e, field, options){
                field.mask(maskBehavior.apply({}, arguments), options);
            }
        };
        $("input[name*=phone]").unmask().mask(maskBehavior, options);

        $("#profile input[name=zipcode]").unmask().mask("00000-000", {onChange : function(zipcode, event, currentField, options){
            if(zipcode.length < 9){
                currentField.removeAttr("readonly").removeClass("loading");
                return;
            };
        }, onComplete : function(zipcode, event, currentField, options){
            currentField.closest("form").addClass("loading");
            currentField.attr("readonly",true);
            loadZipcode(zipcode,currentField)
        }}).unbind("keypress.convertize").bind("keypress.convertize", function(e){
            if(e.keyCode == 13) return false;
        });

        const loadZipcode = async function(zipcode, currentField){
            const $form = currentField.closest("form")
            $form.find("[name$=code_ibge],[name$=city_id]").remove();

            try{
                const response = await axios.get(`/ws/zipcode/?zipcode=${zipcode}`);
                const resp = response.data;
                if(response.status == 200 && resp.success){
                    log(resp);
                    $form.append(`<input type="hidden" name="code_ibge" value="${resp.codigo_ibge || ""}" />`);
                    $form.append(`<input type="hidden" name="city_id" value="${resp.localidade_id || ""}" />`);

                    $form.find("input[name$=address]").val(resp.endereco || "");
                    $form.find("input[name$=city]").val(resp.cidade || "").attr("readonly", !!resp.cidade);

                    if(resp.bairros && resp.bairros.length == 1){
                        $form.find("[name$=neighborhood]").replaceWith(`<input class="form-control" type="text" name="${$form.find("[name$=neighborhood]").attr("name")}" id="${$form.find("[name$=neighborhood]").attr("id")}" value="${resp.bairros[0]}" required maxlength="100" />`);
                    }else if(resp.bairros && resp.bairros.length > 1){
                        const options = resp.bairros.map(function(b){
                            return `<option value="${b}">${b}</option>`
                        });
                        $form.find("[name$=neighborhood]").replaceWith(`<select class="form-control" name="${$form.find("[name$=neighborhood]").attr("name")}" id="${$form.find("[name$=neighborhood]").attr("id")}" required><option value="">---------</option>${options.join("")}</select>`);
                    }else{
                        $form.find("[name$=neighborhood]").replaceWith(`<input class="form-control" type="text" name="${$form.find("[name$=neighborhood]").attr("name")}" id="${$form.find("[name$=neighborhood]").attr("id")}" value="" required maxlength="100" />`);
                    }

                    if(resp.uf){
                        $form.find("[name$=state]").val(resp.uf).attr("disabled","disabled");
                        $form.find("[name$=state]").parent().append(`<input type="hidden" name="${$form.find("[name$=state]").attr("name")}" value="${resp.uf}" />`);
                    }else{
                        $form.find("[name$=state][type=hidden]").remove();
                        $form.find("[name$=state]").removeAttr("disabled");
                    }

                }else{
                    $form.find("[name$=neighborhood]").replaceWith(`<input class="form-control" type="text" name="${$form.find("[name$=neighborhood]").attr("name")}" id="${$form.find("[name$=neighborhood]").attr("id")}" value="" required maxlength="100" />`);
                    $form.find("[name$=state][type=hidden]").remove();
                    $form.find("[name$=state]").removeAttr("disabled");
                }
            }catch(err){
                $form.find("[name$=neighborhood]").replaceWith(`<input class="form-control" type="text" name="${$form.find("[name$=neighborhood]").attr("name")}" id="${$form.find("[name$=neighborhood]").attr("id")}" value="" required maxlength="100" />`);
                $form.find("[name$=state][type=hidden]").remove();
                $form.find("[name$=state]").removeAttr("disabled");
            }

            currentField.closest("form").removeClass("loading");
            currentField.removeAttr("readonly");
        }
    }
});

function addCartNotification(){
    if($('.jq-toast-wrap').length){
        $('.jq-toast-wrap').remove()
    } else {
    	$('[data-toggle="popover"]').popover('show')
        setTimeout(() => {
            $('[data-toggle="popover"]').popover('hide')
            },3000)}
        }

    $(document).ready(
        function(){
            var showPopover = function () {
            $(this).popover('show');
        }, 
            hidePopover = function () {
            $(this).popover('hide');
        };
        $('[data-toggle="popover"]').popover({trigger: 'manual'})
    })
