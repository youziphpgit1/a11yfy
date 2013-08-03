/*global jQuery*/
/*jshint browser:true*/
/**
 *
 * jQuery module for accessible data tables
 *
 */
(function (jQuery){
    var methods,
        $politeAnnouncer = jQuery("#jquery-ui-politeannouncer");

    methods = {
        init: function (options) {
            var opts = jQuery.extend({}, jQuery.fn.accessibleDataTable.defaults, options);

            return this.each(function (index, value) {
                var $table = jQuery(this),
                    $anchors, data, timeout, $select, cellIndex;

                function anchorClickHandler(e) {
                    var $this = jQuery(this),
                        sorted = $this.attr("data-sorted"),
                        direction = "asc",
                        index = this.parentNode.cellIndex,
                        $span = $this.find("span.offscreen"),
                        msg;

                    if (sorted) {
                        direction = (sorted === "asc" ? "desc" : "asc");
                    }
                    // reset all the previous sorting
                    $anchors.removeAttr("data-sorted");
                    sortTableData(data, direction, index);
                    redrawTable($table, data);
                    $this.attr("data-sorted", direction);
                    // Reset the offscreen text
                    $span.text("");
                    // Make announcement
                    msg = "Table sorted by " + $this.text() + ", " + (direction === "asc" ? "Ascending" : "Descending");
                    politeAnnounce(msg);
                    // Set the offscreen text
                    setSortedText($span, $this);
                    e.preventDefault();
                }

                function selectFocusHandler() {
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = undefined;
                    }
                }

                function selectBlurHandler() {
                    timeout = setTimeout(function () {
                        $select.hide();
                        $select.parent().find("a").show();
                    }, 500);
                }


                function selectChangeHandler() {
                    var val = $select.val(),
                        $anchor = $select.parent().find("a");

                    jQuery(data).each(function (index, value) {
                        if (val == value[cellIndex] || val === "__none__") {
                            value[value.length-1].show();
                        } else {
                            value[value.length-1].hide();
                        }
                    });
                    // Make announcement
                    msg = "Table filtered on " + $anchor.text() + ", by " + (val === "__none__" ? "All" : val);
                    politeAnnounce(msg);

                    $select.hide();
                    $anchor.show().focus();
                }

                function anchorFocusHandler(e) {
                    var $this = jQuery(this),
                        $span, msg;

                    if ($this.attr("data-filter")) {
                        if (timeout) {
                            clearTimeout(timeout);
                            timeout = undefined;
                        }
                        $select = $this.parent().find("select");
                        cellIndex = $this.parent().get(0).cellIndex;
                        if (!$select.length) {
                            $select = jQuery("<select>").attr("aria-label", $this.text() + ", Filterable");
                            $select.append(jQuery("<option>").attr("value", "__none__").attr("label", "All"));
                            jQuery(data).each(function (index, value) {
                                $select.append(jQuery("<option>").text(value[cellIndex]));
                            });
                            $this.parent().append($select);
                            $select.bind("mouseover focus", selectFocusHandler)
                                .bind("mouseout blur", selectBlurHandler)
                                .bind("change", selectChangeHandler);
                        } else {
                            $select.show();
                        }
                        if (e.type === "focus") {
                            $select.focus();
                        }
                        $this.hide();
                    } else {
                        $span = $this.find("span.offscreen");
                        if (!$span.length) {
                            $span = jQuery("<span class=\"offscreen\">");
                            $this.append($span);
                        }
                        setSortedText($span, $this);
                    }

                }

                function anchorBlurHandler() {
                    var $this = jQuery(this), $span;

                    if (!$this.attr("data-filter")) {
                        $span = $this.find("span.offscreen");
                        $span.empty().text("");
                    }
                }

                $table.find("th").each(function (index, value) {
                    var $this = jQuery(value);

                    if ($this.attr("data-filter")) {
                        $this.wrapInner("<a href=\"#\" data-filter=\"true\">");
                    } else {
                        $this.wrapInner("<a href=\"#\">");
                    }
                });

                $anchors = $table.find("th a");
                data = getTableData($table);
                $anchors.bind("click", anchorClickHandler)
                    .bind("focus mouseover", anchorFocusHandler)
                    .bind("blur mouseout", anchorBlurHandler);
                $anchors.first().click();
                $table.data( "accessibleDataTable", data);
            });
        },
        destroy: function () {
            return this.each(function (index, value) {
                var $table = jQuery(value),
                    data = $table.data( "accessibleDataTable");
            });
        }
    };

    function politeAnnounce(msg) {
        $politeAnnouncer.append(jQuery("<p>").text(msg));
    }
    function getSortedText($this) {
        var sorted = $this.attr("data-sorted");
        return "Sortable" +
                (sorted === "asc" ? ", Sorted Ascending" :
                (sorted === "desc" ? ", Sorted Descending" :
                ", Not Sorted"));
    }
    function getTableData($table) {
        var retVal = [];
        $table.find("tbody tr").each(function (index, value) {
            var $this = jQuery(value), row = [];
            $this.find("td").each(function (index, td) {
                var text = jQuery.trim(jQuery(td).text()),
                    intNum, flt;

                intNum = parseInt(text, 10);
                flt = parseFloat(text);
                if (intNum.toString() === text) {
                    row.push(intNum);
                } else if (flt.toString() === text) {
                    row.push(flt);
                } else {
                    row.push(text);
                }
            });
            row.push($this); // put the row into the data so we can manipulate
            retVal.push(row);
        });
        return retVal;
    }
    function sortTableData(data, direction, index) {
        data.sort(function (first, second) {
            if (typeof first[index] !== typeof second[index]) {
                if (typeof first[index] === "string") {
                    return (direction === "asc" ? -1 : 1);
                } else if (typeof second[index] === "string") {
                    return (direction === "asc" ? 1 : -1);
                }
            }
            return first[index] < second[index] ? (direction === "asc" ? -1 : 1) :
                    ( first[index] > second[index] ? (direction === "asc" ? 1 : -1) : 0);
        });
    }
    function redrawTable($table, data) {
        var $tbody = $table.find("tbody");
        jQuery(data).each(function (index, value) {
            $tbody.append(value[value.length - 1]);
        });
    }
    function setSortedText($span, $this) {
        $span.text(getSortedText($this));
    }

    // add the jquery instance method
    jQuery.fn.accessibleDataTable = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1 ));
        } else if (typeof method === "object" || ! method) {
            return methods.init.apply(this, arguments);
        } else {
            jQuery.error("Method " +  method + " does not exist on jQuery.slider");
        }
    };

    jQuery.fn.accessibleDataTable.defaults = {
        sortFilter: "both"
    };

    // Add the polite announce div to the page
    if (!jQuery('#jquery-ui-politeannounce').length) {
        jQuery("body").append(
            jQuery("<div>").attr({
                "id": "jquery-ui-politeannounce",
                "role": "log",
                "aria-live": "polite",
                "aria-relevant": "additions"
            }).addClass("offscreen")
        );
    }
})(jQuery);