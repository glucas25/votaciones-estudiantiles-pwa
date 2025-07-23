// src/utils/chartToPdf.js
// Chart to PDF Conversion Utilities

import html2canvas from 'html2canvas';

/**
 * Chart to PDF Converter
 * Converts Recharts components to high-quality images for PDF inclusion
 */
class ChartToPDF {
  constructor() {
    this.defaultOptions = {
      scale: 2, // High DPI for print quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 800,
      height: 400
    };
  }

  /**
   * Convert a chart element to canvas and then to image data
   */
  async convertChartToImage(chartElement, options = {}) {
    const config = { ...this.defaultOptions, ...options };
    
    try {
      console.log('📊 Converting chart to image...');
      
      if (!chartElement) {
        throw new Error('Chart element not found');
      }

      // Ensure chart is visible before capture
      const originalDisplay = chartElement.style.display;
      chartElement.style.display = 'block';
      
      // Wait for chart to render completely
      await this.waitForChartRender(chartElement);
      
      // Capture chart as canvas
      const canvas = await html2canvas(chartElement, {
        scale: config.scale,
        useCORS: config.useCORS,
        allowTaint: config.allowTaint,
        backgroundColor: config.backgroundColor,
        width: config.width,
        height: config.height,
        logging: false,
        onclone: (clonedDoc) => {
          // Ensure all SVG elements are properly rendered
          const svgElements = clonedDoc.querySelectorAll('svg');
          svgElements.forEach(svg => {
            svg.style.backgroundColor = config.backgroundColor;
          });
        }
      });
      
      // Restore original display
      chartElement.style.display = originalDisplay;
      
      // Convert canvas to data URL
      const imageDataURL = canvas.toDataURL('image/png', 1.0);
      
      return {
        success: true,
        dataURL: imageDataURL,
        width: canvas.width,
        height: canvas.height,
        scaledWidth: canvas.width / config.scale,
        scaledHeight: canvas.height / config.scale
      };
      
    } catch (error) {
      console.error('Error converting chart to image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Convert multiple charts to images
   */
  async convertMultipleCharts(chartConfigs) {
    console.log(`📊 Converting ${chartConfigs.length} charts to images...`);
    
    const results = [];
    
    for (const config of chartConfigs) {
      try {
        const result = await this.convertChartToImage(config.element, config.options);
        results.push({
          id: config.id,
          title: config.title,
          ...result
        });
      } catch (error) {
        console.error(`Error converting chart ${config.id}:`, error);
        results.push({
          id: config.id,
          title: config.title,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Create a temporary chart element for PDF generation
   */
  async createTempChart(chartComponent, containerOptions = {}) {
    const defaultContainer = {
      width: 800,
      height: 400,
      position: 'absolute',
      top: '-9999px',
      left: '-9999px',
      backgroundColor: '#ffffff'
    };
    
    const containerStyle = { ...defaultContainer, ...containerOptions };
    
    // Create temporary container
    const tempContainer = document.createElement('div');
    Object.assign(tempContainer.style, containerStyle);
    
    // Add to DOM
    document.body.appendChild(tempContainer);
    
    try {
      // Render chart in temp container
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(tempContainer);
      
      return new Promise((resolve, reject) => {
        try {
          root.render(chartComponent);
          
          // Wait for chart to render
          setTimeout(async () => {
            try {
              const chartElement = tempContainer.querySelector('.recharts-wrapper') || 
                                 tempContainer.querySelector('svg') || 
                                 tempContainer.firstChild;
              
              if (chartElement) {
                const result = await this.convertChartToImage(chartElement, containerOptions);
                resolve(result);
              } else {
                reject(new Error('Chart element not found in temporary container'));
              }
            } catch (error) {
              reject(error);
            } finally {
              // Cleanup
              root.unmount();
              document.body.removeChild(tempContainer);
            }
          }, 1000); // Give chart time to render
          
        } catch (error) {
          reject(error);
        }
      });
      
    } catch (error) {
      // Cleanup on error
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
      throw error;
    }
  }

  /**
   * Generate chart data for common electoral charts
   */
  generateElectoralCharts(data) {
    const charts = [];
    
    // Participation Chart (Pie)
    if (data.participation) {
      charts.push({
        id: 'participation_pie',
        title: 'Distribución de Participación',
        type: 'pie',
        data: [
          { name: 'Votaron', value: data.participation.voted, fill: '#059669' },
          { name: 'Ausentes', value: data.participation.absent, fill: '#dc2626' }
        ]
      });
    }
    
    // Results by Course (Bar)
    if (data.byCourse) {
      charts.push({
        id: 'course_participation',
        title: 'Participación por Curso',
        type: 'bar',
        data: data.byCourse.map(course => ({
          name: course.course,
          votaron: course.voted,
          ausentes: course.absent,
          total: course.total
        }))
      });
    }
    
    // Results by Candidate/List (Bar)
    if (data.results) {
      charts.push({
        id: 'results_chart',
        title: 'Resultados Electorales',
        type: 'bar',
        data: data.results.map(result => ({
          name: result.name || result.listName,
          votos: result.votes,
          porcentaje: result.percentage
        }))
      });
    }
    
    // Participation by Level (Pie)
    if (data.byLevel) {
      charts.push({
        id: 'level_participation',
        title: 'Participación por Nivel',
        type: 'pie',
        data: data.byLevel.map((level, index) => ({
          name: level.level,
          value: level.participation,
          fill: this.getColorByIndex(index)
        }))
      });
    }
    
    return charts;
  }

  /**
   * Create React chart components from data
   */
  createChartComponents(chartData) {
    const React = require('react');
    const { 
      BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
      PieChart, Pie, Cell, ResponsiveContainer 
    } = require('recharts');
    
    return chartData.map(chart => {
      switch (chart.type) {
        case 'bar':
          return React.createElement(
            ResponsiveContainer,
            { width: '100%', height: 400, key: chart.id },
            React.createElement(
              BarChart,
              { data: chart.data, margin: { top: 20, right: 30, left: 20, bottom: 5 } },
              React.createElement(CartesianGrid, { strokeDasharray: '3 3' }),
              React.createElement(XAxis, { dataKey: 'name', angle: -45, textAnchor: 'end', height: 100 }),
              React.createElement(YAxis, null),
              React.createElement(Tooltip, null),
              React.createElement(Legend, null),
              ...Object.keys(chart.data[0] || {})
                .filter(key => key !== 'name')
                .map((key, index) => 
                  React.createElement(Bar, { 
                    key: key,
                    dataKey: key, 
                    fill: this.getColorByIndex(index),
                    name: key.charAt(0).toUpperCase() + key.slice(1)
                  })
                )
            )
          );
          
        case 'pie':
          return React.createElement(
            ResponsiveContainer,
            { width: '100%', height: 400, key: chart.id },
            React.createElement(
              PieChart,
              { margin: { top: 20, right: 30, left: 20, bottom: 20 } },
              React.createElement(
                Pie,
                {
                  data: chart.data,
                  cx: '50%',
                  cy: '50%',
                  labelLine: false,
                  label: ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`,
                  outerRadius: 120,
                  fill: '#8884d8',
                  dataKey: 'value'
                },
                chart.data.map((entry, index) => 
                  React.createElement(Cell, { 
                    key: `cell-${index}`, 
                    fill: entry.fill || this.getColorByIndex(index) 
                  })
                )
              ),
              React.createElement(Tooltip, null),
              React.createElement(Legend, null)
            )
          );
          
        default:
          return null;
      }
    }).filter(Boolean);
  }

  /**
   * Wait for chart to fully render
   */
  async waitForChartRender(element, maxWait = 3000) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkRender = () => {
        const svgElement = element.querySelector('svg');
        const hasContent = svgElement && svgElement.children.length > 0;
        const elapsed = Date.now() - startTime;
        
        if (hasContent || elapsed > maxWait) {
          resolve();
        } else {
          requestAnimationFrame(checkRender);
        }
      };
      
      checkRender();
    });
  }

  /**
   * Get color by index for consistent chart coloring
   */
  getColorByIndex(index) {
    const colors = [
      '#1e40af', // Blue
      '#059669', // Green  
      '#dc2626', // Red
      '#7c2d12', // Orange
      '#7c3aed', // Purple
      '#0891b2', // Cyan
      '#65a30d', // Lime
      '#be123c', // Rose
      '#a16207', // Yellow
      '#4338ca'  // Indigo
    ];
    
    return colors[index % colors.length];
  }

  /**
   * Optimize image for PDF (compress if needed)
   */
  optimizeImageForPDF(dataURL, maxSizeKB = 500) {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate optimal dimensions
        let { width, height } = img;
        const maxDimension = 1200;
        
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw optimized image
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels to meet size requirement
        let quality = 0.9;
        let optimizedDataURL;
        
        do {
          optimizedDataURL = canvas.toDataURL('image/jpeg', quality);
          const sizeKB = (optimizedDataURL.length * 0.75) / 1024; // Approximate size
          
          if (sizeKB <= maxSizeKB) break;
          quality -= 0.1;
          
        } while (quality > 0.1);
        
        resolve({
          dataURL: optimizedDataURL,
          width,
          height,
          quality
        });
      };
      
      img.src = dataURL;
    });
  }
}

export default new ChartToPDF();