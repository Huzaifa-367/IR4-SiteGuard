<?php

namespace App\Support;

class ExcelXmlExporter
{
    /**
     * @param  list<string>  $headers
     * @param  iterable<int, list<string|int|float|null>>  $rows
     */
    public static function stream(string $sheetName, array $headers, iterable $rows): void
    {
        echo '<?xml version="1.0" encoding="UTF-8"?>';
        echo '<?mso-application progid="Excel.Sheet"?>';
        echo '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
        echo '<Worksheet ss:Name="'.self::escape($sheetName).'"><Table>';

        echo '<Row>';
        foreach ($headers as $header) {
            echo '<Cell><Data ss:Type="String">'.self::escape($header).'</Data></Cell>';
        }
        echo '</Row>';

        foreach ($rows as $row) {
            echo '<Row>';
            foreach ($row as $cell) {
                echo '<Cell><Data ss:Type="String">'.self::escape($cell === null ? '' : (string) $cell).'</Data></Cell>';
            }
            echo '</Row>';
        }

        echo '</Table></Worksheet></Workbook>';
    }

    private static function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }
}
