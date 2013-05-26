jQuery(document).ready(function() {
	$('.container a').smoothScroll();
	$(".nav.boxer_nav li").on("click", function() {
		$(".nav.boxer_nav li").removeClass("active");
		$(this).addClass("active");
	});
});