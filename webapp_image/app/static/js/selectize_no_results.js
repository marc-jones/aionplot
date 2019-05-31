$(document).ready(function() {
/*
https://github.com/brianreavis/selectize.js/issues/470
Selectize doesn't display anything to let the user know there are no results.
This plugin allows us to render a no results message when there are no
results are found to select for.

This file was modified from https://gist.github.com/dwickwire/3b5c9485467b0d01ef24f7fdfa140d92 to prevent the no results message appearing before ajax calls are finished
*/

    Selectize.define( 'no_results', function( options ) {
        var self = this;

        options = $.extend({
            message: 'No results found.',
            html: function(data) {
                return (
                    '<div class="selectize-dropdown ' + data.classNames + '">' +
                    '<div class="selectize-dropdown-content">' +
                        '<div class="no-results">' + data.message + '</div>' +
                    '</div>' +
                    '</div>'
                );
            }
        }, options );

        self.displayEmptyResultsMessage = function () {
            this.$empty_results_container.css('top', this.$control.outerHeight());
            this.$empty_results_container.css('width', this.$control.outerWidth());
            this.$empty_results_container.show();
            this.$control.addClass("dropdown-active");
        };

        self.refreshOptions = (function () {
            var original = self.refreshOptions;

            return function () {
                var query             = $.trim(self.$control_input.val());
                var results           = self.search(query);

                original.apply(self, arguments);

                if (self.loading==0 && results.tokens.length!=0 && results.total==0) {
                    self.displayEmptyResultsMessage();
                } else {
                    this.$empty_results_container.hide();
                }
            }
        })();

        self.onSearchChange = (function() {
            return function(value) {
                var fn = self.settings.load;
                if (!fn) return;
                if (self.loadedSearches.hasOwnProperty(value)) return;
                self.loadedSearches[value] = true;
                self.load(function(callback) {
                    fn.apply(self, [value, callback]);},
                );
            };
        })();

        self.load = (function() {
            return function(fn) {
                var $wrapper = self.$wrapper.addClass(self.settings.loadingClass);
                self.loading++;
                fn.apply(self, [function(results) {
                    self.loading = Math.max(self.loading - 1, 0);
                    if (results && results.length) {
                        self.addOption(results);
                        self.refreshOptions(self.isFocused && !self.isInputHidden);
                    } else {
                        self.refreshOptions();
                    }
                    if (!self.loading) {
                        $wrapper.removeClass(self.settings.loadingClass);
                    }
                    self.trigger('load', results);
                }]);
            };
        })();

        self.onKeyDown = (function () {
            var original = self.onKeyDown;

            return function ( e ) {
            original.apply( self, arguments );
            if ( e.keyCode === 27 ) {
                this.$empty_results_container.hide();
            }
            }
        })();

        self.onBlur = (function () {
            var original = self.onBlur;

            return function () {
            original.apply( self, arguments );
            this.$empty_results_container.hide();
            this.$control.removeClass("dropdown-active");
            };
        })();

        self.setup = (function() {
            var original = self.setup;
            return function() {
            original.apply(self, arguments);
            self.$empty_results_container = $(options.html($.extend({
                classNames: self.$input.attr('class')
            }, options)));
            self.$empty_results_container.insertBefore(self.$dropdown);
            self.$empty_results_container.hide();
            };
        })();
    });
});
