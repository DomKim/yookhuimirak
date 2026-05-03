$(document).ready(function() {
	$("#send").click(function() {
		entry_update();
	});
});

$(function() {
	$( ".droptrue" ).sortable({
		connectWith: "div",
		//revert: true,
		remove: function( event, ui ) {

			//console.log(ui.item.index());
			var class_name = event.target.id; //출발 영역의 ID값
			var sortedIDs = $(this).sortable( "toArray" ); // 옮기기전 리스트 배열 생성.

		},
		receive: function( event, ui ) {

			//var class_name = event.target.id; //도착 영역의 ID값
			var class_name = this.id; //도착 영역의 ID값

			var txt = $("#"+class_name+" .ui-state-default").eq(ui.item.index()).text(); // 옮긴 객체의 텍스트값
			var txt = (txt.replace(/ /g, '')).split(",");
			console.log(class_name+"/"+txt[1]);

			var sortedIDs = $(this).sortable( "toArray" ); // 옮긴 영역 배열 생성 (타겟)

		}

	});


	$( "#sortable1, #sortable2, #sortable3, #sortable4, #sortable5, #side_left, #side_right, #b_side_left, #b_side_right" ).disableSelection();


});

// 엔트리 변경 내용 저장
function entry_update() {

	// 배열 만들기.
	var list_a	= $("#sortable1").sortable( "toArray" ); // 대기열
	var list_b	= $("#sortable2").sortable( "toArray" ); // 해드
	var list_c	= $("#sortable3").sortable( "toArray" ); // 컨텐츠
	var list_d  = $("#sortable4").sortable( "toArray" ); // 푸터

	var left_sidebar = $("#side_left").sortable( "toArray" );
	var right_sidebar = $("#side_right").sortable( "toArray" );
	var b_left_sidebar = $("#b_side_left").sortable( "toArray" );
	var b_right_sidebar = $("#b_side_right").sortable( "toArray" );

	var name = $('#name').attr('value');

	//return false;
	//alert("※ 각 영역별로 선택된 id_no 자바 배열 상태 혹인\n아이템 :"+list_a+"\n상단 : "+list_b+"\n컨텐츠 : "+list_c+"\n하단 : "+list_d+"\n왼쪽 : "+left_sidebar+"\n오른쪽 : "+right_sidebar+"\n큰왼족 : "+b_left_sidebar+"\n큰오른 : "+b_right_sidebar)
	// 배열을 POST로 넘김
	$.ajax({
		url: "block_setup_layout_up.php",
		type:"POST",
		data:{
			"mode":"UPDATE",
			"name":name,
			"empty":list_a,
			"head":list_b,
			"content":list_c,
			"footer":list_d,
			"left_sidebar":left_sidebar,
			"right_sidebar":right_sidebar,
			"b_left_sidebar":b_left_sidebar,
			"b_right_sidebar":b_right_sidebar
		},
		dataType: "json",
		async: false,
           cache: false,
		success: function(data){
			if(data=="OK") {
				alert("변경 내용이 저장되었습니다.");
				window.location.reload(true); //현재화면 새로고침
			}
		}
	})
}
