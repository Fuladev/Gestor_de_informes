/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.fula_constructor_s.a.s;

/**
 *
 * @author RyZen 5 Pro
 */
import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Element;
import com.itextpdf.text.Font;
import com.itextpdf.text.Image;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;

import javax.swing.JFileChooser;
import javax.swing.filechooser.FileNameExtensionFilter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.swing.JOptionPane;

public class CreatePDFExample {

    // Definir estilos de fuente
    private static Font titleFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, BaseColor.DARK_GRAY);
    private static Font normalFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, BaseColor.DARK_GRAY);
    private static Font normalBoldFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.DARK_GRAY);

    // seleccionar imágenes y agregarlas al documento
    public static void selectImage(Document document) throws DocumentException {
        JFileChooser fileChooser = new JFileChooser();
        fileChooser.setMultiSelectionEnabled(true);
        fileChooser.setDialogTitle("Seleccionar Imágenes");
        fileChooser.setFileFilter(new FileNameExtensionFilter("Archivos de Imagen", "jpg", "png", "jpeg"));

        int userSelection = fileChooser.showOpenDialog(null);

        if (userSelection == JFileChooser.APPROVE_OPTION) {
            File[] selectedFiles = fileChooser.getSelectedFiles();
            
            

            PdfPTable tablename = new PdfPTable(1);
            tablename.setWidthPercentage(100);
            tablename.setPaddingTop(12);
            
            PdfPCell space = new PdfPCell(new Paragraph(" ", normalBoldFont));
            //space.setPadding(5);
            space.setBorder(PdfPCell.NO_BORDER);
            tablename.addCell(space);
            
            String servicioPrestado = obtenerNombreServicio();

            // Crear la tabla principal
            PdfPTable table = new PdfPTable(3);
            // Crear la tabla principal
            PdfPTable tablenam = new PdfPTable(1);

            // Create the cell with the service name
            PdfPCell nameserv = new PdfPCell(new Paragraph("1. " + servicioPrestado, normalBoldFont));
            nameserv.setHorizontalAlignment(Element.ALIGN_CENTER);
            nameserv.setBackgroundColor(BaseColor.LIGHT_GRAY);

            // Add the nameserv cell to the tablename
            tablename.addCell(nameserv);

            // ... other code to add images or tables
            document.add(tablenam);
            
            try {
                document.add(tablename);
            } catch (DocumentException ex) {
                Logger.getLogger(CreatePDFExample.class.getName()).log(Level.SEVERE, null, ex);
            }

            // Crear una tabla de 3 columnas para las imágenes (independiente de cuántas imágenes se seleccionen)
            int col = (selectedFiles.length / 10) + 4;
            PdfPTable imageTable = new PdfPTable(col);
            imageTable.setWidthPercentage(100); // Ajustar el ancho de la tabla
            try {
                imageTable.setWidths(new float[]{});  // Definir los anchos de las columnas
            } catch (DocumentException e) {
                e.printStackTrace();
            }

            // Agregar las imágenes seleccionadas a la tabla
            for (File file : selectedFiles) {
                try {
                    Image img = Image.getInstance(file.getAbsolutePath());

                    // Controlar mejor la escala de las imágenes
                    float maxWidth = 100;  // Ancho máximo permiøtido
                    float maxHeight = 50; // Alto máximo permitido
                    float width = img.getWidth();
                    float height = img.getHeight();

                    // Calcular la relación de escala manteniendo el aspecto de la imagen
                    float scaleFactor = Math.min(maxWidth / width, maxHeight / height);
                    img.scaleAbsolute(width * scaleFactor, height * scaleFactor);

                    PdfPCell imageCell = new PdfPCell(img, true);
                    imageCell.setPadding(5);
                    imageCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    imageCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                    imageTable.addCell(imageCell);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            // Si el número de imágenes seleccionadas no llena todas las columnas, agregar celdas vacías
            int remainingCells = (col - (selectedFiles.length % col)) % col;
            if (remainingCells != 0) {  // Solo añadir celdas vacías si es necesario
                for (int i = 0; i < remainingCells; i++) {
                    imageTable.addCell(new PdfPCell());
                }
            }

            try {
                document.add(imageTable);  // Agregar la tabla de imágenes al documento
            } catch (DocumentException e) {
                e.printStackTrace();
            }
        } else {
            System.out.println("No se seleccionaron imágenes.");
        }
    }

    // seleccionar la ubicación y nombre del archivo PDF
    public static File selectSaveLocation() {
        JFileChooser fileChooser = new JFileChooser();
        fileChooser.setDialogTitle("Guardar PDF");
        fileChooser.setFileFilter(new FileNameExtensionFilter("Archivo PDF", "pdf"));
        fileChooser.setSelectedFile(new File("informe de obra.pdf")); // Nombre por defecto

        int userSelection = fileChooser.showSaveDialog(null);
        if (userSelection == JFileChooser.APPROVE_OPTION) {
            return fileChooser.getSelectedFile();
        } else {
            System.out.println("No se seleccionó ninguna ubicación para guardar el archivo.");
            return null;
        }
    }

    public static void main(String[] args) {
        File file = selectSaveLocation();
        if (file == null) {
            return;  // Salir si no se seleccionó ubicación para guardar el archivo
        }

        try {
            // Crear el documento
            Document document = new Document();

            // Crear el PdfWriter con la ubicación seleccionada
            PdfWriter.getInstance(document, new FileOutputStream(file));

            // Abrir el documento
            document.open();

            // Crear una tabla con 3 columnas
            PdfPTable table = new PdfPTable(3);
            table.setWidthPercentage(100); // Ancho de la tabla
            table.setWidths(new float[]{1, 1, 1}); // Definir el ancho de las columnas

            // Imagen del logo
            Image logo = Image.getInstance("src\\main\\java\\com\\mycompany\\fula_constructor_s\\a\\s\\img/Recurso 2.png");  // Cambia la ruta por tu imagen
            logo.scaleToFit(100, 50);
            PdfPCell cell1 = new PdfPCell(logo);
            cell1.setBorder(PdfPCell.BOX);
            cell1.setBackgroundColor(BaseColor.LIGHT_GRAY);
            cell1.setHorizontalAlignment(Element.ALIGN_CENTER);  // Centrar la imagen en la celda
            cell1.setVerticalAlignment(Element.ALIGN_MIDDLE);
            table.addCell(cell1);

            // Celda de texto del título
            PdfPCell cell2 = new PdfPCell(new Paragraph("INFORME DE VISITA TÉCNICA", titleFont));
            cell2.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell2.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cell2.setBorder(PdfPCell.BOX);
            cell2.setBackgroundColor(BaseColor.LIGHT_GRAY);
            table.addCell(cell2);

            // Crear una tabla interna para la celda 3
            PdfPTable innerTable = new PdfPTable(1);
            innerTable.setWidthPercentage(100);

            // Celda para la fecha
            PdfPCell fechaCell = new PdfPCell(new Paragraph("7/08/2024", normalBoldFont));
            fechaCell.setBorder(PdfPCell.BOX);
            fechaCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            innerTable.addCell(fechaCell);

            // Celda para la versión
            PdfPCell versionLabelCell = new PdfPCell(new Paragraph("VERSIÓN", normalBoldFont));
            versionLabelCell.setBorder(PdfPCell.BOX);
            versionLabelCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            innerTable.addCell(versionLabelCell);

            // Celda para el número de versión
            PdfPCell versionNumberCell = new PdfPCell(new Paragraph("1", normalBoldFont));
            versionNumberCell.setBorder(PdfPCell.BOX);
            versionNumberCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            innerTable.addCell(versionNumberCell);

            // Añadir la tabla interna a la celda 3
            PdfPCell cell3 = new PdfPCell(innerTable);
            cell3.setBorder(PdfPCell.NO_BORDER);
            cell3.setBackgroundColor(BaseColor.LIGHT_GRAY);
            table.addCell(cell3);

            // Segunda fila
            PdfPTable innerTable2 = new PdfPTable(1);
            PdfPCell number = new PdfPCell(new Paragraph("ORDEN DE OBRA No", normalBoldFont));
            innerTable2.addCell(number);
            PdfPCell ubic = new PdfPCell(new Paragraph("UBICACIÓN", normalBoldFont));
            innerTable2.addCell(ubic);
            PdfPCell cell4 = new PdfPCell(innerTable2);
            cell4.setBorder(PdfPCell.NO_BORDER);
            cell4.setBackgroundColor(BaseColor.LIGHT_GRAY);
            table.addCell(cell4);

            PdfPTable innerTable3 = new PdfPTable(1);
            PdfPCell numberO = new PdfPCell(new Paragraph("084-134", normalFont));
            innerTable3.addCell(numberO);
            PdfPCell ubicO = new PdfPCell(new Paragraph("", normalFont));
            innerTable3.addCell(ubicO);
            PdfPCell cell5 = new PdfPCell(innerTable3);
            cell5.setBorder(PdfPCell.NO_BORDER);
            table.addCell(cell5);

            PdfPTable innerTable4 = new PdfPTable(1);
            PdfPTable innerTable41 = new PdfPTable(2);
            PdfPCell fechai = new PdfPCell(new Paragraph("FECHA INICIO:", normalBoldFont));
            fechai.setBackgroundColor(BaseColor.LIGHT_GRAY);
            innerTable41.addCell(fechai);
            PdfPCell fechaiO = new PdfPCell(new Paragraph("22/05/2024", normalFont));
            innerTable41.addCell(fechaiO);
            PdfPCell cellfecha = new PdfPCell(innerTable41);
            cellfecha.setBorder(PdfPCell.NO_BORDER);
            innerTable4.addCell(cellfecha);

            PdfPTable innerTable42 = new PdfPTable(2);
            PdfPCell fechaf = new PdfPCell(new Paragraph("FECHA FINAL:", normalBoldFont));
            fechaf.setBackgroundColor(BaseColor.LIGHT_GRAY);
            innerTable42.addCell(fechaf);
            PdfPCell fechafO = new PdfPCell(new Paragraph("22/05/2024", normalFont));
            innerTable42.addCell(fechafO);
            PdfPCell cellfechaf = new PdfPCell(innerTable42);
            cellfechaf.setBorder(PdfPCell.NO_BORDER);
            innerTable4.addCell(cellfechaf);

            PdfPCell cell6 = new PdfPCell(innerTable4);
            cell6.setBorder(PdfPCell.NO_BORDER);
            table.addCell(cell6);

            document.add(table);

            // Tercera fila
            PdfPTable table2 = new PdfPTable(2);
            table2.setWidthPercentage(100);
            table2.setWidths(new float[]{1, 2});

            PdfPCell cell7 = new PdfPCell(new Paragraph("JUSTIFICACIÓN DEL TRABAJO", normalBoldFont));
            cell7.setBackgroundColor(BaseColor.LIGHT_GRAY);
            table2.addCell(cell7);
            PdfPCell cell8 = new PdfPCell(new Paragraph("", normalFont));
            table2.addCell(cell8);

            PdfPCell cell9 = new PdfPCell(new Paragraph("ACTIVIDADES", normalBoldFont));
            cell9.setBackgroundColor(BaseColor.LIGHT_GRAY);
            table2.addCell(cell9);
            PdfPCell cell10 = new PdfPCell(new Paragraph("MANTENIMIENTOS GENERALES", normalFont));
            cell10.setHorizontalAlignment(Element.ALIGN_CENTER);
            table2.addCell(cell10);

            document.add(table2);

            // Seleccionar imágenes y agregarlas al documento
            selectImage(document);
            
            // Cerrar el documento
            document.close();

            System.out.println("PDF creado exitosamente.");

        } catch (DocumentException | IOException e) {
            e.printStackTrace();
        }
    }
    // Método para obtener el nombre del servicio con validación básica
    private static String obtenerNombreServicio() {
        String servicioPrestado;
        do {
            servicioPrestado = JOptionPane.showInputDialog(null, "Ingrese el nombre del servicio prestado:");
            if (servicioPrestado == null || servicioPrestado.trim().isEmpty()) {
                JOptionPane.showMessageDialog(null, "Debe ingresar un nombre de servicio válido.");
            }
        } while (servicioPrestado == null || servicioPrestado.trim().isEmpty());
        return servicioPrestado;
    }
}
