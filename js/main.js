'use strict'

var filters = {},
    view, hash, itemview;

var base = 'node_modules/everkinetic-data/dist/';

$(function ready () {
    view.init();
    itemview.init();

    $.getJSON(base + 'exercises.json').then($.proxy(view.render, view));

    $('body').on('click', 'a.mdl-card__square', function (e) {
        var node = $(e.currentTarget);
        itemview.render(node.data());
        e.preventDefault();
    });

    $(document).keyup(function(e) {
      if (e.keyCode === 27) itemview.hide();
    });
});

hash = {

    add: function (id) {
        hash.set(id, true);
    },

    set: function (id, data) {
        if (!data) return hash.remove(id);
        localStorage.setItem(id, JSON.stringify(data));
    },

    remove: function (id) {
        localStorage.removeItem(id)
    },

    get: function (id) {
        var value = localStorage.getItem(id);
        if (!value) return;
        return JSON.parse(value);
    },

    toggle: function (id) {
        if (hash.has(id)) return hash.remove(id);
        hash.add(id);
    },

    keys: function () {
        return Object.keys(localStorage);
    },

    has: function (id) {
        return !!hash.get(id);
    }

};

// pseude backbone view
view = {

    $el: $('.mdl-grid'),

    init: function () {
        this.bLazy = new Blazy({
            container: '.page-content',
            effect : 'fadeIn'
        });
        this.ui = {
            counter: $('.counter')
        };
        this.register();
    },

    initIsotope: function () {
        this.$el.isotope({
            itemSelector: '.mdl-card__square',
            layoutMode: 'fitRows',
            sortby: 'beds',
            getSortData: {
                name: '.item--title',
                duration: '.item--duration--text[data-value]',
                rating: '.item--rating--text',
                price: '.item--price--text',
                //beds: '.item--beds--text[data-value]',
                beds : function($elem){
                    return parseInt($($elem).find('.item--rating--text').text().replace(' kcal'), 10)
                }
            }
        });

        this.$el.isotope({ sortBy: 'beds' });
    },

    applyFilter: function () {
        var filterValue = '';
        // combine filters
        for (var prop in filters) {
            filterValue += filters[prop];
        }
        // set filter for Isotope
        this.$el.isotope({
            sortBy: 'beds',
            filter: filterValue
        });
    },

    applyQuery: function () {
        var query = $('#search').val().toLowerCase();
         // set filter for Isotope
        this.$el.isotope({
            sortBy: 'beds',
            filter: function () {
                if (!query) return true;
                var text = $(this).find('.mdl-card__title-text').text();
                return text.toLowerCase().indexOf(query) >= 0;
            }
        });
    },


    register: function  () {
        // filters
        var self = this;
        // $('.filter--container').on('click', '.mdl-button', function (e) {
        //     var $this = $(this),
        //         $buttonGroup = $this.parents('.mdl-button-group'),
        //         filterGroup = $buttonGroup.attr('data-filter-group');

        //     // set filter for group
        //     filters[filterGroup] = $this.attr('data-filter');

        //     var group = $(e.target).closest('.mdl-button-group');
        //     group.find('.mdl-button').removeClass('mdl-button--colored');
        //     $(e.target).closest('.mdl-button').addClass('mdl-button--colored')

        //     self.applyFilter();
        // });

        $('#search').on('keyup', _.debounce(self.applyQuery.bind(self), 150)),

        this.$el.on('click', '.button--favorite', function (e) {
            var base = $(e.target).closest('.mdl-card__square'),
                id = base.attr('data-id');
            base.toggleClass('favorite');
            hash.toggle(id);
            self.applyFilter();
            e.stopPropagation()
            e.stopImmediatePropagation()
            e.preventDefault()
        });



        this.$el.on('arrangeComplete', $.proxy(this.onArrangeComplete, this));
    },

    onArrangeComplete: function () {
        this.ui.counter.text($('.mdl-card__square:visible').length + ' Treffer');
        this.bLazy.revalidate();
    },

    render: function (list) {
        this.$el.empty();
        $.each(list, $.proxy(this.renderItem, this));
        this.onArrangeComplete();
        this.initIsotope();
    },

    renderItem: function (index, data) {

        if (data.svg && data.svg.length) data.image = base + data.svg[0];

        var node = $($.templates('#itemTemplate').render(data));

        this.$el.append(node);
    }
};

// pseudo backbone listview
itemview = {

    $el: $('.itemview-container'),

    init: function () {
        this.register();
    },

    hide: function () {
        $(document.body).removeClass('dialog-visible');
    },

    show: function () {
        $(document.body).addClass('dialog-visible')
        this.$el.css('top', $(document.body).scrollTop());
    },

    register: function  () {
        this.$el.on('click', 'li', function (e) {
            var node = $(e.target);
            node.toggleClass('done');
        })
    },

    onArrangeComplete: function () {
        this.ui.counter.text($('.mdl-card__square:visible').length + ' Treffer');
        this.bLazy.revalidate();
    },

    render: function (data) {
        this.$el.empty();
        this.show();
        var node = $($.templates('#itemTemplate').render(data));

        // highlight thermomix parts
        _.each(node.find('li'), function (line) {
            var line = $(line);
            var text = line.text().replace(/(\([^)]+\))/g, '<b>$1</b>');
            line.html(text);
        });

        this.$el.append(node);
    }
};






