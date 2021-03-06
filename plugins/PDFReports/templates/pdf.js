/*!
 * Piwik - Web Analytics
 *
 * @link http://piwik.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

var getReportParametersFunctions = Object();
var updateReportParametersFunctions = Object();
var resetReportParametersFunctions = Object();

function formSetEditReport(idReport) {
    var report = {
        'type': ReportPlugin.defaultReportType,
        'format': ReportPlugin.defaultReportFormat,
        'description': '',
        'period': ReportPlugin.defaultPeriod,
        'hour': ReportPlugin.defaultHour,
        'reports': []
    };

    if (idReport > 0) {
        report = ReportPlugin.reportList[idReport];
        $('#report_submit').val(ReportPlugin.updateReportString);
    }
    else {
        $('#report_submit').val(ReportPlugin.createReportString);
    }

    toggleReportType(report.type);

    $('#report_description').html(report.description);
    $('#report_type option[value=' + report.type + ']').prop('selected', 'selected');
    $('#report_period option[value=' + report.period + ']').prop('selected', 'selected');
    $('#report_hour').val(report.hour);
    $('[name=report_format].' + report.type + ' option[value=' + report.format + ']').prop('selected', 'selected');

    $('[name=reportsList] input').prop('checked', false);

    var key;
    for (key in report.reports) {
        $('.' + report.type + ' [report-unique-id=' + report.reports[key] + ']').prop('checked', 'checked');
    }

    updateReportParametersFunctions[report.type](report.parameters);

    $('#report_idreport').val(idReport);
}

function getReportAjaxRequest(idReport, defaultApiMethod) {
    var parameters = {};
    piwikHelper.lazyScrollTo(".entityContainer", 400);
    parameters.module = 'API';
    parameters.method = defaultApiMethod;
    if (idReport == 0) {
        parameters.method = 'PDFReports.addReport';
    }
    parameters.format = 'json';
    return parameters;
}

function toggleReportType(reportType) {
    resetReportParametersFunctions[reportType]();
    $('#report_type option').each(function (index, type) {
        $('.' + $(type).val()).hide();
    });
    $('.' + reportType).show();
}

function initManagePdf() {
    // Click Add/Update Submit
    $('#addEditReport').submit(function () {
        var idReport = $('#report_idreport').val();
        var apiParameters = getReportAjaxRequest(idReport, 'PDFReports.updateReport');
        apiParameters.idReport = idReport;
        apiParameters.description = $('#report_description').val();
        apiParameters.reportType = $('#report_type option:selected').val();
        apiParameters.reportFormat = $('[name=report_format].' + apiParameters.reportType + ' option:selected').val();

        var reports = [];
        $('[name=reportsList].' + apiParameters.reportType + ' input:checked').each(function () {
            reports.push($(this).attr('report-unique-id'));
        });
        if (reports.length > 0) {
            apiParameters.reports = reports;
        }

        apiParameters.parameters = getReportParametersFunctions[apiParameters.reportType]();

        var ajaxHandler = new ajaxHelper();
        ajaxHandler.addParams(apiParameters, 'POST');
        ajaxHandler.addParams({period: $('#report_period option:selected').val()}, 'GET');
        ajaxHandler.addParams({hour: $('#report_hour').val()}, 'GET');
        ajaxHandler.redirectOnSuccess();
        ajaxHandler.setLoadingElement();
        ajaxHandler.send(true);
        return false;
    });

    // Email now
    $('a[name=linkSendNow]').click(function () {
        var idReport = $(this).attr('idreport');
        var parameters = getReportAjaxRequest(idReport, 'PDFReports.sendReport');
        parameters.idReport = idReport;

        var ajaxHandler = new ajaxHelper();
        ajaxHandler.addParams(parameters, 'POST');
        ajaxHandler.setLoadingElement();
        ajaxHandler.send(true);
    });

    // Delete Report
    $('a[name=linkDeleteReport]').click(function () {
        var idReport = $(this).attr('id');

        function onDelete() {
            var parameters = getReportAjaxRequest(idReport, 'PDFReports.deleteReport');
            parameters.idReport = idReport;

            var ajaxHandler = new ajaxHelper();
            ajaxHandler.addParams(parameters, 'POST');
            ajaxHandler.redirectOnSuccess();
            ajaxHandler.setLoadingElement();
            ajaxHandler.send(true);
        }

        piwikHelper.modalConfirm('#confirm', {yes: onDelete});
    });

    // Edit Report click
    $('a[name=linkEditReport]').click(function () {
        var idReport = $(this).attr('id');
        formSetEditReport(idReport);
        $('.entityAddContainer').show();
        $('#entityEditContainer').hide();
    });

    // Switch Report Type
    $('#report_type').change(function () {
        var reportType = $(this).val();
        toggleReportType(reportType);
    });

    // Add a Report click
    $('#linkAddReport').click(function () {
        $('.entityAddContainer').show();
        $('#entityEditContainer').hide();
        formSetEditReport(/*idReport = */0);
    });

    // Cancel click
    $('.entityCancelLink').click(function () {
        $('.entityAddContainer').hide();
        $('#entityEditContainer').show();
        piwikHelper.hideAjaxError();
    }).click();
}
