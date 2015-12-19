!function ($) {

	$.fn.TouchUI.knockout = {

		beforeLoad: function(viewModels) {
			var self = this,
				terminalViewModel = viewModels[0],
				connectionViewModel = viewModels[1],
				settingsViewModel = viewModels[2],
				softwareUpdateViewModel = viewModels[3],
				controlViewModel = viewModels[4],
				gcodeFilesViewModel = viewModels[5];

			this.DOM.init.call(this);
			this.scroll.beforeLoad.call(this);

			if( !self.isTouch ) {
				gcodeFilesViewModel.listHelper.paginatedItems.subscribe(function(a) {
					setTimeout(function() {
						try {
							self.scroll.iScrolls.body.refresh();
						} catch(err) {
							// Do nothing
						};
					}, 300);
				});
			}

			// Prevent the onTabChange function from hiding the webcam on the new webcam tab
			var oldTabChange = controlViewModel.onTabChange;
			controlViewModel.onTabChange = function(previous, current) {

				//Pretend we are #control, and not control on control
				current = (current === "#control") ? "#control_without_webcam" : current;
				current = (current === "#webcam") ? "#control" : current;

				previous = (previous === "#control") ? "#control_without_webcam" : previous;
				previous = (previous === "#webcam") ? "#control" : previous;

				if( !self.isTouch ) {
					setTimeout(function() {
						try {
							self.scroll.iScrolls.body.refresh();
						} catch(err) {
							// Do nothing
						};
					}, 100);
				}

				oldTabChange.call(this, previous, current);
			};
		},

		isReady: function(touchViewModel, viewModels) {
			var self = this,
				terminalViewModel = viewModels[0],
				connectionViewModel = viewModels[1],
				settingsViewModel = viewModels[2],
				softwareUpdateViewModel = viewModels[3],
				controlViewModel = viewModels[4],
				gcodeFilesViewModel = viewModels[5],
				navigationViewModel = viewModels[6];

			this.terminal.init.call(this, terminalViewModel);

			// Remove slimScroll from files list
			$('.gcode_files').slimScroll({destroy: true});
			$('.slimScrollDiv').slimScroll({destroy: true});

			// Remove drag files into website feature
			$(document).off("dragover");

			// Watch the operational binder for visual online/offline
			var subscription = connectionViewModel.isOperational.subscribe(function(newOperationalState) {
				var printLink = $("#all_touchui_settings");
				if( !newOperationalState ) {
					printLink.addClass("offline").removeClass("online");
					$("#conn_link2").addClass("offline").removeClass("online");
				} else {
					printLink.removeClass("offline").addClass("online");
					$("#conn_link2").removeClass("offline").addClass("online");
				}
			});

			// Refresh LESS file after saving settings
			settingsViewModel.sending.subscribe(function(isSending) {
				var $less = $("#touchui-custom-less");
				if($less.length === 0) {
					$('<link href="/plugin/touchui/static/less/_generated/touchui.custom.less" rel="stylesheet/less" type="text/css" media="screen" id="touchui-custom-less">').appendTo("head");
					less.sheets[0] = document.getElementById('touchui-custom-less');
				}
				if(!isSending) {
					$("#touchui-custom-less").attr("href", "/plugin/touchui/static/less/_generated/touchui.custom.less?v=" + new Date().getTime());
					$("#touchui-custom-less").next('style').remove();
					less.refresh();
				}
			});

			// Redo scroll-to-end interface
			$("#term .terminal small.pull-right").html('<a href="#"><i class="fa fa-angle-double-down"></i></a>').on("click", function() {
				terminalViewModel.scrollToEnd();
				return false;
			});

			// Overwrite terminal knockout functions (i.e. scroll to end)
			this.scroll.koOverwrite.call(this, terminalViewModel);

			// Setup version tracking in terminal
			this.version.init.call(this, softwareUpdateViewModel);

			// Bind fullscreenChange to knockout
			$(document).bind("fullscreenchange", function() {
				self.isFullscreen = ($(document).fullScreen() !== false);
				touchViewModel.isFullscreen(self.isFullscreen);
				self.DOM.cookies.set("fullscreen", self.isFullscreen);
			});

			// Hide topbar and/or refresh the scrollheight if clicking an item
			// Notice: Use delegation in order to trigger the event after the tab content has changed, other click events fire before content change.
			$(document).on("click", '#tabs [data-toggle="tab"]', function() {
				self.animate.hide.call(self, "navbar");
			});

			// (Re-)Apply bindings to the new webcam div
			if($("#webcam").length > 0) {
				ko.applyBindings(controlViewModel, $("#webcam")[0]);
			}
			if($("#control-jog-feedrate").length > 0) {
				ko.applyBindings(controlViewModel, $("#control-jog-feedrate")[0]);
			}
			if($("#navbar_login").length > 0) {
				ko.applyBindings(navigationViewModel, $("#navbar_login")[0]);

				// Force the dropdown to appear open when logedIn
				navigationViewModel.loginState.loggedIn.subscribe(function(loggedIn) {
					if( loggedIn ) {
						$('#navbar_login a.dropdown-toggle').addClass("hidden_touch");
						$('#login_dropdown_loggedin').removeClass('hide dropdown open').addClass('visible_touch');
					} else {
						$('#navbar_login a.dropdown-toggle').removeClass("hidden_touch");
						$('#login_dropdown_loggedin').removeClass('visible_touch');
					}

					// Refresh scroll view when login state changed
					setTimeout(function() {
						self.scroll.currentActive.refresh();
					}, 0);
				});
			}
			if($("#navbar_systemmenu").length > 0) {
				ko.applyBindings(navigationViewModel, $("#navbar_systemmenu")[0]);
				ko.applyBindings(navigationViewModel, $("#divider_systemmenu")[0]);
			}

		}
	}

}(window.jQuery);