/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.fula_constructor_s.a.s;

import java.io.File;
import java.util.HashMap;

/**
 *
 * @author RyZen 5 Pro
 */
public class Informe {
    
    private String Cliente, numInforme, fechaInicio, fechaFin, ubicacion, justificacion, actividades, nameRes, numRes;
    private HashMap<String, File[]> servicios;

    public Informe(String Cliente, String numInforme, String fechaInicio, String fechaFin, String ubicacion, String justificacion, String actividades, String nameRes, String numRes, HashMap<String, File[]> servicios) {
        this.Cliente = Cliente;
        this.numInforme = numInforme;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.ubicacion = ubicacion;
        this.justificacion = justificacion;
        this.actividades = actividades;
        this.nameRes = nameRes;
        this.numRes = numRes;
        this.servicios = servicios;
    }

    public Informe() {
    }
    

    public String getNumInforme() {
        return numInforme;
    }

    public void setNumInforme(String numInforme) {
        this.numInforme = numInforme;
    }

    public String getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(String fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public String getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(String fechaFin) {
        this.fechaFin = fechaFin;
    }

    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }

    public String getJustificacion() {
        return justificacion;
    }

    public void setJustificacion(String justificacion) {
        this.justificacion = justificacion;
    }

    public String getActividades() {
        return actividades;
    }

    public void setActividades(String actividades) {
        this.actividades = actividades;
    }

    public String getNameRes() {
        return nameRes;
    }

    public void setNameRes(String nameRes) {
        this.nameRes = nameRes;
    }

    public String getNumRes() {
        return numRes;
    }

    public void setNumRes(String numRes) {
        this.numRes = numRes;
    }

    public HashMap<String, File[]> getServicios() {
        return servicios;
    }

    public void setServicios(HashMap<String, File[]> servicios) {
        this.servicios = servicios;
    }
    
    
}
