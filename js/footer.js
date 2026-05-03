//자동하이픈기능추가
const autoHyphen2 = (target) => {
    target.value = target.value
        .replace(/[^0-9]/g, '')
        .replace(/^(\d{0,3})(\d{0,4})(\d{0,4})$/g, "$1-$2-$3").replace(/(\-{1,2})$/g, "");
}


//폼메일 (footer quick) — validate + regex + ajax
$('.quick_submit_div').on('click', function() {
    var REGEX_NAME  = /^[가-힣A-Za-z\s]{2,30}$/;
    var REGEX_PHONE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

    var nm   = $('#name_quick').val().trim();
    var tel  = $('#tel1_quick').val().trim();
    var area = $('#area_quick').val().trim();

    if (nm === '')                  { alert('성함을 입력해주세요.');   $('#name_quick').focus(); return; }
    if (!REGEX_NAME.test(nm))       { alert('성함은 한글/영문 2~30자만 가능합니다.'); $('#name_quick').focus(); return; }
    if (tel === '')                 { alert('연락처를 입력해주세요.'); $('#tel1_quick').focus(); return; }
    if (!REGEX_PHONE.test(tel))     { alert('연락처 형식이 올바르지 않습니다. 예: 010-1234-5678'); $('#tel1_quick').focus(); return; }
    if (!$('.quickAgree_checkbox').is(':checked')) { alert('개인정보 수집 및 이용에 동의해주세요.'); return; }

    // sendBeacon — URLSearchParams (PHP $_POST 호환)
    var params = new URLSearchParams();
    params.append('source', 'footer_quick');
    params.append('name',   nm);
    params.append('tel1',   tel);
    params.append('area',   area);
    params.append('agree',  '1');
    var blob = new Blob([params.toString()], { type: 'application/x-www-form-urlencoded' });
    var ok = navigator.sendBeacon('/bbs/mail.php', blob);
    if (ok) {
        alert('문의양식이 전송 되었습니다.');
        $('#name_quick').val('');
        $('#tel1_quick').val('');
        $('#area_quick').val('');
        $('.quickAgree_checkbox').prop('checked', false);
    } else {
        alert('전송 실패. 잠시 후 다시 시도해주세요.');
    }
})
//개인정보처리 방침//
var elements = document.getElementsByClassName("per_Infor_policy");
var modal = document.getElementById("modal");

for (var i = 0; i < elements.length; i++) {
    elements[i].addEventListener("click", function() {
        event.preventDefault();
        modal.style.display = "block";
    });
}

var closeButton = document.getElementsByClassName("close")[0];

closeButton.addEventListener("click", function() {
    modal.style.display = "none";
});

window.addEventListener("click", function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
});
//개인정보처리 방침//
