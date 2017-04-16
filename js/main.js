'use strict'

var filters = {},
    listview, itemview;
var base = 'dist/data/';

$(function ready () {
    listview.init();
    itemview.init();

    // data and deep links
    $.getJSON(base + 'exercises.json')
        .then($.proxy(listview.render, listview))
        .then(function () { _.defer(onHashChange); });

    $('body').on('click', 'a.mdl-card__square', function (e) {
        var node = $(e.currentTarget);
        var data = node.data();
        // itemview.render(data);
        location.hash = data.name;
        e.preventDefault();
    });

    $(document)
        .keyup(function(e) {
          if (e.keyCode !== 27) return;
          itemview.hide();
        })
        .on('click', '.action--close', itemview.hide.bind(itemview))

    window.addEventListener('hashchange', onHashChange, false);
});

function onHashChange() {
    var value = location.hash.split('#')[1];
    // history back
    if (!value) return itemview.hide();
    // deep links and clicks
    var node = listview.$el.find('[href="#' + value + '"]');
    if (!node.length) return;

    itemview.render(node.data());
}

// pseudo backbone listview
listview = {

    $el: $('.mdl-grid'),

    init: function () {
        this.bLazy = new Blazy({
            container: '.page-content',
            effect : 'fadeIn'
        });
        this.ui = {
            counter: $('.counter'),
            filter: $('.filter--container')
        };
        this.register();
    },

    initIsotope: function () {
        this.$el.isotope({
            itemSelector: '.mdl-card__square',
            layoutMode: 'fitRows',
            sortby: 'since',
            getSortData: {
                name: '.item--title',
                duration: '.item--duration--text[data-value]',
                rating: '.item--rating--text',
                price: '.item--price--text',
                since : function($elem) {
                    var value = parseInt($($elem).find('.button--favorite').attr('data-since'), 10);
                    value = $.isNumeric(value) ? value : 0;
                    return value * (1);
                }
            }
        });

        this.$el.isotope({ sortBy: 'name' });
    },

    applyFilter: function () {
        var filterValue = '';
        // combine filters
        for (var prop in filters) {
            filterValue += filters[prop];
        }

        // set filter for Isotope
        this.$el.isotope({
            sortBy: filterValue === '.favorite' ? 'since' : 'name',
            filter: filterValue
        });
    },

    applyQuery: function () {
        var query = $('#search').val().toLowerCase();
         // set filter for Isotope

        function contains(a, b) {
            return a.toLowerCase().indexOf(b.toLowerCase().trim()) > -1;
        }

        this.$el.isotope({
            sortBy: 'beds',
            filter: function () {
                if (!query) return true;
                var text = $(this).find('.mdl-card__title-text').text(),
                    qList = _.chain(query.split(' ')).uniq().compact().value(),
                    tList = _.uniq(text.split(' ')),
                    matches = _.intersectionWith(tList, qList, contains);
                return matches.length >= qList.length;
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
            return false;
        });

        this.$el.on('arrangeComplete', $.proxy(this.onArrangeComplete, this));
    },

    onArrangeComplete: function () {
        this.ui.counter.text($('.mdl-card__square:visible').length + ' Hits');
        this.bLazy.revalidate();
    },

    render: function (list) {
        this.$el.empty();
        $.each(list, $.proxy(this.renderItem, this));
        this.onArrangeComplete();
        this.initIsotope();
    },

    processData: function (data) {
       // add primaray image for listview
       if (data.svg && data.svg.length) {
            data.image = base + data.svg[0];
            data.svg = _.map(data.svg, function (path) {
                return base + path;
            });
        }
        // comma separated list
        _.each(['primary', 'secondary', 'equipment'], function (prop) {
            if (data[prop] && _.isArray(data[prop]) && data[prop].length > 1) data[prop] = data[prop].join(', ');
        });
    },

    renderItem: function (index, data) {
        this.processData(data);

        var node = $($.templates('#itemviewTemplate').render(data));

        node.data(data);

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
        location.hash = '#';
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
        this.$el.append(
            $($.templates('#itemTemplate').render(data))
        );
    }
};


